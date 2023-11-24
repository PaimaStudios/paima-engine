import { Pool } from 'pg';
import type { PoolClient } from 'pg';

import {
  ChainDataExtensionDatumType,
  doLog,
  ENV,
  Network,
  SCHEDULED_DATA_ADDRESS,
} from '@paima/utils';
import {
  tx,
  getConnection,
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
  getCardanoLatestProcessedCdeSlot,
  markCardanoCdeSlotProcessed,
} from '@paima/db';
import Prando from '@paima/prando';

import { randomnessRouter } from './randomness.js';
import { cdeTransitionFunction } from './cde-processing.js';
import type {
  SubmittedData,
  ChainData,
  PresyncChainData,
  ChainDataExtensionDatum,
  GameStateTransitionFunction,
  GameStateMachineInitializer,
} from './types.js';
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
      getPresyncBlockHeight: async (dbTx: PoolClient | Pool = readonlyDBConn): Promise<number> => {
        const [b] = await getLatestProcessedCdeBlockheight.run(undefined, dbTx);
        const blockHeight = b?.block_height ?? 0;
        return blockHeight;
      },
      getPresyncCardanoSlotHeight: async (
        dbTx: PoolClient | Pool = readonlyDBConn
      ): Promise<number> => {
        const [b] = await getCardanoLatestProcessedCdeSlot.run(undefined, dbTx);
        const slot = b?.slot ?? 0;
        return slot;
      },
      presyncStarted: async (dbTx: PoolClient | Pool = readonlyDBConn): Promise<boolean> => {
        const res = await getLatestProcessedCdeBlockheight.run(undefined, dbTx);
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
      getReadWriteDbConn: (): Pool => {
        return DBConn;
      },
      presyncProcess: async (dbTx: PoolClient, latestCdeData: PresyncChainData): Promise<void> => {
        if (latestCdeData.network === Network.EVM) {
          const cdeDataLength = await processCdeData(
            latestCdeData.blockNumber,
            latestCdeData.extensionDatums,
            dbTx
          );
          if (cdeDataLength > 0) {
            doLog(`Processed ${cdeDataLength} CDE events in block #${latestCdeData.blockNumber}`);
          }
        } else if (latestCdeData.network === Network.CARDANO) {
          const cdeDataLength = await processCardanoCdeData(
            latestCdeData.blockNumber,
            latestCdeData.extensionDatums,
            dbTx
          );
          if (cdeDataLength > 0) {
            doLog(`Processed ${cdeDataLength} CDE events in slot #${latestCdeData.blockNumber}`);
          }
        }
      },
      markPresyncMilestone: async (
        blockHeight: number,
        dbTx: PoolClient | Pool = readonlyDBConn
      ): Promise<void> => {
        await markCdeBlockheightProcessed.run({ block_height: blockHeight }, dbTx);
      },
      markCardanoPresyncMilestone: async (dbTx: PoolClient, slot: number): Promise<void> => {
        await markCardanoCdeSlotProcessed.run({ slot: slot }, dbTx);
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
          const data = await gameStateTransition(
            {
              userAddress: userAddress,
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

        const cdeDataLength = await processCdeData(
          latestChainData.blockNumber,
          latestChainData.extensionDatums,
          dbTx
        );

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
  markProcessed: () => Promise<void>
): Promise<number> {
  if (!cdeData) {
    return 0;
  }

  for (const datum of cdeData) {
    const sqlQueries = await cdeTransitionFunction(dbTx, datum);
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
  cdeData: ChainDataExtensionDatum[] | undefined,
  dbTx: PoolClient
): Promise<number> {
  return await processCdeDataBase(cdeData, dbTx, async () => {
    await markCdeBlockheightProcessed.run({ block_height: blockHeight }, dbTx);
    return;
  });
}

async function processCardanoCdeData(
  slot: number,
  cdeData: ChainDataExtensionDatum[] | undefined,
  dbTx: PoolClient
): Promise<number> {
  return await processCdeDataBase(cdeData, dbTx, async () => {
    await markCardanoCdeSlotProcessed.run({ slot: slot }, dbTx);
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
    const inputData: SubmittedData = {
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
  for (const inputData of latestChainData.submittedData) {
    // Check nonce is valid
    if (inputData.inputNonce === '') {
      doLog(`Skipping inputData with invalid empty nonce: ${JSON.stringify(inputData)}`);
      continue;
    }
    const nonceData = await findNonce.run({ nonce: inputData.inputNonce }, DBConn);
    if (nonceData.length > 0) {
      doLog(`Skipping inputData with duplicate nonce: ${JSON.stringify(inputData)}`);
      continue;
    }

    // Trigger STF
    const sqlQueries = await gameStateTransition(
      {
        ...inputData,
        inputData: inputData.inputData,
      },
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

export default SM;
