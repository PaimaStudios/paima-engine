import { Pool } from 'pg';
import type { PoolClient, Client } from 'pg';

import type { STFSubmittedData } from '@paima/utils';
import {
  doLog,
  ENV,
  GlobalConfig,
  InternalEventType,
  SCHEDULED_DATA_ADDRESS,
  SCHEDULED_DATA_ID,
} from '@paima/utils';
import {
  tx,
  getConnection,
  getPersistentConnection,
  initializePaimaTables,
  storeGameInput,
  blockHeightDone,
  deleteScheduled,
  findNonce,
  insertNonce,
  getLatestProcessedBlockHeight,
  getScheduledDataByBlockHeight,
  saveLastBlockHeight,
  markCdeBlockheightProcessed,
  getLatestProcessedCdeBlockheight,
  getMainAddress,
  NO_USER_ID,
  updateCardanoEpoch,
  updatePaginationCursor,
} from '@paima/db';
import Prando from '@paima/prando';

import { randomnessRouter } from './randomness.js';
import { cdeTransitionFunction } from './cde-processing.js';
import { DelegateWallet } from './delegate-wallet.js';
import type {
  SubmittedData,
  ChainData,
  PresyncChainData,
  ChainDataExtensionDatum,
  GameStateTransitionFunction,
  GameStateMachineInitializer,
  InternalEvent,
} from './types.js';
import { ConfigNetworkType } from '@paima/utils';
import assertNever from 'assert-never';

export * from './types.js';
export type * from './types.js';

const SM: GameStateMachineInitializer = {
  initialize: (
    databaseInfo,
    randomnessProtocolEnum,
    gameStateTransitionRouter,
    startBlockHeight
  ) => {
    const DBConn: Pool = getConnection(databaseInfo);
    const persistentReadonlyDBConn: Client = getPersistentConnection(databaseInfo);
    const readonlyDBConn: Pool = getConnection(databaseInfo, true);

    return {
      latestProcessedBlockHeight: async (
        dbTx: PoolClient | Pool = readonlyDBConn
      ): Promise<number> => {
        const [b] = await getLatestProcessedBlockHeight.run(undefined, dbTx);
        const start = ENV.EMULATED_BLOCKS ? 0 : startBlockHeight;
        const blockHeight = b?.block_height ?? start ?? 0;
        return blockHeight;
      },
      getPresyncBlockHeight: async (
        network: string,
        dbTx: PoolClient | Pool = readonlyDBConn
      ): Promise<number> => {
        const [b] = await getLatestProcessedCdeBlockheight.run({ network }, dbTx);
        const blockHeight = b?.block_height ?? 0;
        return blockHeight;
      },
      presyncStarted: async (
        network: string,
        dbTx: PoolClient | Pool = readonlyDBConn
      ): Promise<boolean> => {
        const res = await getLatestProcessedCdeBlockheight.run({ network }, dbTx);
        return res.length > 0;
      },
      syncStarted: async (dbTx: PoolClient | Pool = readonlyDBConn): Promise<boolean> => {
        const res = await getLatestProcessedBlockHeight.run(undefined, dbTx);
        return res.length > 0;
      },
      initializeDatabase: async (force: boolean = false): Promise<boolean> => {
        return await tx<boolean>(DBConn, dbTx => initializePaimaTables(dbTx, force));
      },
      getReadonlyDbConn: (): Pool => {
        return readonlyDBConn;
      },
      getPersistentReadonlyDbConn: (): Client => {
        return persistentReadonlyDBConn;
      },
      getReadWriteDbConn: (): Pool => {
        return DBConn;
      },
      presyncProcess: async (dbTx: PoolClient, latestCdeData: PresyncChainData): Promise<void> => {
        if (
          latestCdeData.networkType === ConfigNetworkType.EVM ||
          latestCdeData.networkType === ConfigNetworkType.EVM_OTHER
        ) {
          const cdeDataLength = await processCdeData(
            latestCdeData.blockNumber,
            latestCdeData.network,
            latestCdeData.extensionDatums,
            dbTx,
            true
          );
          if (cdeDataLength > 0) {
            doLog(
              `[${latestCdeData.network}] Processed ${cdeDataLength} CDE events in block #${latestCdeData.blockNumber}`
            );
          }
        } else if (latestCdeData.networkType === ConfigNetworkType.CARDANO) {
          const cdeDataLength = await processCardanoCdeData(
            latestCdeData.carpCursor,
            latestCdeData.extensionDatums,
            dbTx,
            true
          );
          if (cdeDataLength > 0) {
            doLog(
              `[${latestCdeData.network}] Processed ${cdeDataLength} CDE events in ${latestCdeData.carpCursor.cursor}`
            );
          }
        } else if (latestCdeData.networkType === ConfigNetworkType.MINA) {
          // not really correct, but should work for now. Probably that function should be renamed
          const cdeDataLength = await processCardanoCdeData(
            latestCdeData.minaCursor,
            latestCdeData.extensionDatums,
            dbTx,
            true
          );
          if (cdeDataLength > 0) {
            doLog(
              `[${latestCdeData.network}] Processed ${cdeDataLength} CDE events in ${latestCdeData.minaCursor.cursor}`
            );
          }
        }
      },
      markPresyncMilestone: async (
        blockHeight: number,
        network: string,
        dbTx: PoolClient | Pool = readonlyDBConn
      ): Promise<void> => {
        await markCdeBlockheightProcessed.run({ block_height: blockHeight, network }, dbTx);
      },
      dryRun: async (
        gameInput: string,
        userAddress: string,
        dbTxOrPool: PoolClient | Pool = readonlyDBConn
      ): Promise<boolean> => {
        const internal = async (dbTx: PoolClient): Promise<boolean> => {
          const [b] = await getLatestProcessedBlockHeight.run(undefined, dbTx);
          const blockHeight = b?.block_height ?? startBlockHeight ?? 0;
          const gameStateTransition = gameStateTransitionRouter(blockHeight);
          const address = await getMainAddress(userAddress, dbTx);

          const data = await gameStateTransition(
            {
              realAddress: userAddress,
              userAddress: address.address,
              userId: address.id,
              inputData: gameInput,
              inputNonce: '',
              suppliedValue: '0',
              scheduled: false,
              dryRun: true,
            },
            blockHeight,
            new Prando('1234567890'),
            dbTx
          );
          return data && data.length > 0;
        };
        if (dbTxOrPool instanceof Pool) {
          return await tx<boolean>(dbTxOrPool, dbTx => internal(dbTx));
        } else {
          return await internal(dbTxOrPool);
        }
      },
      // Core function which triggers state transitions
      process: async (dbTx: PoolClient, latestChainData: ChainData): Promise<void> => {
        // Acquire correct STF based on router (based on block height)
        const gameStateTransition = gameStateTransitionRouter(latestChainData.blockNumber);
        // Save blockHeight and randomness seed
        const getSeed = randomnessRouter(randomnessProtocolEnum);
        const seed = await getSeed(latestChainData, dbTx);
        await saveLastBlockHeight.run(
          { block_height: latestChainData.blockNumber, seed: seed },
          dbTx
        );
        // Generate Prando object
        const randomnessGenerator = new Prando(seed);

        const extensionsPerNetwork: { [network: string]: ChainDataExtensionDatum[] } = {};

        for (const extensionData of latestChainData.extensionDatums || []) {
          if (!extensionsPerNetwork[extensionData.network]) {
            extensionsPerNetwork[extensionData.network] = [];
          }

          extensionsPerNetwork[extensionData.network].push(extensionData);
        }

        let cdeDataLength = 0;

        for (const network of Object.keys(extensionsPerNetwork)) {
          cdeDataLength += await processCdeData(
            latestChainData.blockNumber,
            network,
            extensionsPerNetwork[network],
            dbTx,
            false
          );
        }

        await processInternalEvents(latestChainData.internalEvents, dbTx);

        const checkpointName = `game_sm_start`;
        await dbTx.query(`SAVEPOINT ${checkpointName}`);
        try {
          // Fetch and execute scheduled input data
          const scheduledInputsLength = await processScheduledData(
            latestChainData,
            dbTx,
            gameStateTransition,
            randomnessGenerator
          );

          // Execute user submitted input data
          const userInputsLength = await processUserInputs(
            latestChainData,
            dbTx,
            gameStateTransition,
            randomnessGenerator
          );

          // Extra logging
          if (cdeDataLength + userInputsLength + scheduledInputsLength > 0)
            doLog(
              `Processed ${userInputsLength} user inputs, ${scheduledInputsLength} scheduled inputs and ${cdeDataLength} CDE events in block #${latestChainData.blockNumber}`
            );
        } catch (e) {
          await dbTx.query(`ROLLBACK TO SAVEPOINT ${checkpointName}`);
          throw e;
        } finally {
          await dbTx.query(`RELEASE SAVEPOINT ${checkpointName}`);

          // Commit finishing of processing to DB
          await blockHeightDone.run({ block_height: latestChainData.blockNumber }, dbTx);
        }
      },
    };
  },
};

async function processCdeDataBase(
  cdeData: ChainDataExtensionDatum[] | undefined,
  dbTx: PoolClient,
  inPresync: boolean,
  markProcessed: () => Promise<void>
): Promise<number> {
  if (!cdeData) {
    return 0;
  }

  for (const datum of cdeData) {
    const sqlQueries = await cdeTransitionFunction(dbTx, datum, inPresync);
    try {
      for (const [query, params] of sqlQueries) {
        await query.run(params, dbTx);
      }
    } catch (err) {
      doLog(`[paima-sm] Database error on cdeTransitionFunction: ${err}`);
      throw err;
    }
  }

  try {
    await markProcessed();
  } catch (err) {
    doLog(`[paima-sm] Database error on markCdeBlockheightProcessed: ${err}`);
    throw err;
  }
  return cdeData.length;
}

async function processCdeData(
  blockHeight: number,
  network: string,
  cdeData: ChainDataExtensionDatum[] | undefined,
  dbTx: PoolClient,
  inPresync: boolean
): Promise<number> {
  const [mainNetwork, _] = await GlobalConfig.mainEvmConfig();
  return await processCdeDataBase(cdeData, dbTx, inPresync, async () => {
    // During the presync,
    //     we know that the block_height is for that network in particular,
    //     since the block heights are not mapped in that phase.
    // During the sync,
    //     the blockHeight we are processing here is for the main network instead,
    //     which doesn't make sense for cde's from other networks.
    // To tackle this, we have 2 options:
    //     1. Store the original block in ChainDataExtensionDatum
    //        and then use it to update here
    //     2. (what we picked) Through the internal events (see EvmLastBlock)
    if (inPresync || network == mainNetwork) {
      await markCdeBlockheightProcessed.run({ block_height: blockHeight, network }, dbTx);
    }
    return;
  });
}

async function processCardanoCdeData(
  paginationCursor:
    | { cdeId: number; cursor: string; finished: boolean }
    | { cdeId: number; slot: number; finished: boolean },
  cdeData: ChainDataExtensionDatum[] | undefined,
  dbTx: PoolClient,
  inPresync: boolean
): Promise<number> {
  return await processCdeDataBase(cdeData, dbTx, inPresync, async () => {
    if ('cursor' in paginationCursor) {
      await updatePaginationCursor.run(
        {
          cde_id: paginationCursor.cdeId,
          cursor: paginationCursor.cursor,
          finished: paginationCursor.finished,
        },
        dbTx
      );
    } else {
      await updatePaginationCursor.run(
        {
          cde_id: paginationCursor.cdeId,
          cursor: paginationCursor.slot.toString(),
          finished: paginationCursor.finished,
        },
        dbTx
      );
    }
    return;
  });
}

// Process all of the scheduled data inputs by running each of them through the game STF,
// saving the results to the DB, and deleting the schedule data all together in one postgres tx.
// Function returns number of scheduled inputs that were processed.
async function processScheduledData(
  latestChainData: ChainData,
  DBConn: PoolClient,
  gameStateTransition: GameStateTransitionFunction,
  randomnessGenerator: Prando
): Promise<number> {
  const scheduledData = await getScheduledDataByBlockHeight.run(
    { block_height: latestChainData.blockNumber },
    DBConn
  );
  for (const data of scheduledData) {
    const inputData: STFSubmittedData = {
      userId: SCHEDULED_DATA_ID,
      realAddress: SCHEDULED_DATA_ADDRESS,
      userAddress: SCHEDULED_DATA_ADDRESS,
      inputData: data.input_data,
      inputNonce: '',
      suppliedValue: '0',
      scheduled: true,
    };
    // Trigger STF
    const sqlQueries = await gameStateTransition(
      inputData,
      data.block_height,
      randomnessGenerator,
      DBConn
    );
    try {
      for (const [query, params] of sqlQueries) {
        await query.run(params, DBConn);
      }
      await deleteScheduled.run({ id: data.id }, DBConn);
    } catch (err) {
      doLog(`[paima-sm] Database error on deleteScheduled: ${err}`);
      throw err;
    }
  }
  return scheduledData.length;
}

// Process all of the user inputs data inputs by running each of them through the game STF,
// saving the results to the DB with the nonces, all together in one postgres tx.
// Function returns number of user inputs that were processed.
async function processUserInputs(
  latestChainData: ChainData,
  DBConn: PoolClient,
  gameStateTransition: GameStateTransitionFunction,
  randomnessGenerator: Prando
): Promise<number> {
  for (const submittedData of latestChainData.submittedData) {
    // Check nonce is valid
    if (submittedData.inputNonce === '') {
      doLog(`Skipping inputData with invalid empty nonce: ${JSON.stringify(submittedData)}`);
      continue;
    }
    const nonceData = await findNonce.run({ nonce: submittedData.inputNonce }, DBConn);
    if (nonceData.length > 0) {
      doLog(`Skipping inputData with duplicate nonce: ${JSON.stringify(submittedData)}`);
      continue;
    }
    const address = await getMainAddress(submittedData.realAddress, DBConn);

    const inputData: STFSubmittedData = {
      ...submittedData,
      userAddress: address.address,
      userId: address.id,
    };

    // Check if internal Concise Command
    // Internal Concise Commands are prefixed with an ampersand (&)
    //
    // delegate       = &wd|from?|to?|from_signature|to_signature
    // migrate        = &wm|from?|to?|from_signature|to_signature
    // cancelDelegate = &wc|to_signature
    const delegateWallet = new DelegateWallet(DBConn);
    if (inputData.inputData.startsWith(DelegateWallet.INTERNAL_COMMAND_PREFIX)) {
      const status = await delegateWallet.process(
        inputData.realAddress,
        inputData.userAddress,
        inputData.inputData
      );
      if (!status) continue;
    } else if (inputData.userId === NO_USER_ID) {
      // If wallet does not exist in address table: create it.
      const newAddress = await delegateWallet.createAddress(inputData.userAddress);
      inputData.userId = newAddress.id;
    }

    // Trigger STF
    const sqlQueries = await gameStateTransition(
      inputData,
      latestChainData.blockNumber,
      randomnessGenerator,
      DBConn
    );

    try {
      for (const [query, params] of sqlQueries) {
        await query.run(params, DBConn);
      }
      await insertNonce.run(
        {
          nonce: inputData.inputNonce,
          block_height: latestChainData.blockNumber,
        },
        DBConn
      );
      if (ENV.STORE_HISTORICAL_GAME_INPUTS) {
        await storeGameInput.run(
          {
            block_height: latestChainData.blockNumber,
            input_data: inputData.inputData,
            user_address: inputData.userAddress,
          },
          DBConn
        );
      }
    } catch (err) {
      doLog(`[paima-sm] Database error on gameStateTransition: ${err}`);
      throw err;
    }
  }
  return latestChainData.submittedData.length;
}

async function processInternalEvents(
  events: InternalEvent[] | undefined,
  dbTx: PoolClient
): Promise<void> {
  if (!events) {
    return;
  }

  for (const event of events) {
    switch (event.type) {
      case InternalEventType.CardanoBestEpoch:
        await updateCardanoEpoch.run({ epoch: event.epoch }, dbTx);
        break;
      case InternalEventType.EvmLastBlock:
        await markCdeBlockheightProcessed.run(
          {
            block_height: event.block,
            network: event.network,
          },
          dbTx
        );
        break;
      default:
        assertNever(event);
    }
  }
}

export default SM;
