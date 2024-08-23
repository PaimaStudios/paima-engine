import { Pool } from 'pg';
import type { PoolClient, Client } from 'pg';

import {
  genV1BlockHeader,
  hashBlock,
  hashSubmittedData,
  hashTimerData,
  type STFSubmittedData,
} from '@paima/chain-types';
import {
  caip2PrefixFor,
  doLog,
  ENV,
  GlobalConfig,
  InternalEventType,
  logError,
  SCHEDULED_DATA_ADDRESS,
  SCHEDULED_DATA_ID,
  strip0x,
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
  saveLastBlock,
  markCdeBlockheightProcessed,
  getLatestProcessedCdeBlockheight,
  getMainAddress,
  NO_USER_ID,
  updateCardanoEpoch,
  updatePaginationCursor,
  updateMinaCheckpoint,
  insertEvent,
  createIndexesForEvents,
  registerEventTypes,
} from '@paima/db';
import type { SQLUpdate } from '@paima/db';
import Prando from '@paima/prando';
import { randomnessRouter } from './randomness.js';
import { cdeTransitionFunction } from './cde-processing.js';
import { DelegateWallet } from './delegate-wallet.js';
import type {
  ChainData,
  PresyncChainData,
  ChainDataExtensionDatum,
  GameStateTransitionFunction,
  GameStateMachineInitializer,
  InternalEvent,
  Precompiles,
} from './types.js';
import { ConfigNetworkType } from '@paima/utils';
import assertNever from 'assert-never';
import { keccak_256 } from 'js-sha3';
import type { AppEvents, EventPathAndDef, generateAppEvents, ResolvedPath } from '@paima/events';
import { PaimaEventManager } from '@paima/events';
import { PaimaEventBroker } from '@paima/broker';

export * from './types.js';
export type * from './types.js';

type ValueOf<T> = T[keyof T];

type TxHashes = {
  successTxHashes: string[];
  failedTxHashes: string[];
};
const SM: GameStateMachineInitializer = {
  initialize: (
    databaseInfo,
    randomnessProtocolEnum,
    gameStateTransitionRouter,
    startBlockHeight,
    precompiles,
    events
  ) => {
    const DBConn: Pool = getConnection(databaseInfo);
    const persistentReadonlyDBConn: Client = getPersistentConnection(databaseInfo);
    const readonlyDBConn: Pool = getConnection(databaseInfo, true);

    if (ENV.MQTT_BROKER) {
      new PaimaEventBroker('Paima-Engine').getServer();
    }

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
      initializeEventIndexes: async (): Promise<boolean> => {
        return await tx<boolean>(DBConn, dbTx =>
          createIndexesForEvents(
            dbTx,
            Object.values(events).flatMap(eventsByName =>
              eventsByName.flatMap(event =>
                event.definition.fields.map(f => ({
                  topic: event.topicHash,
                  fieldName: f.name,
                  indexed: f.indexed,
                }))
              )
            )
          )
        );
      },
      initializeAndValidateRegisteredEvents: async (): Promise<boolean> => {
        return await tx<boolean>(DBConn, dbTx =>
          registerEventTypes(
            dbTx,
            Object.values(events).flatMap(eventByName =>
              eventByName.flatMap(event => ({
                name: event.definition.name,
                topic: event.topicHash,
              }))
            )
          )
        );
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
          const cdeDataLength = await processPaginatedCdeData(
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
          const cdeDataLength = await processPaginatedCdeData(
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
              caip2: '',
              txHash: '',
            },
            // TODO: fill this once we have the timestamp stored in the database
            {
              blockHeight,
              msTimestamp: b.ms_timestamp.getTime(),
              version: 1,
              mainChainBlochHash: b.main_chain_block_hash.toString('hex'),
              prevBlockHash:
                b?.paima_block_hash == null ? null : b.paima_block_hash.toString('hex'),
            },
            new Prando('1234567890'),
            dbTx
          );
          return data && data.stateTransitions.length > 0;
        };
        if (dbTxOrPool instanceof Pool) {
          return await tx<boolean>(dbTxOrPool, dbTx => internal(dbTx));
        } else {
          return await internal(dbTxOrPool);
        }
      },
      // Core function which triggers state transitions
      process: async (dbTx: PoolClient, latestChainData: ChainData): Promise<number> => {
        // Acquire correct STF based on router (based on block height)
        const gameStateTransition = gameStateTransitionRouter(latestChainData.blockNumber);
        // Save blockHeight and randomness seed
        const getSeed = randomnessRouter(randomnessProtocolEnum);
        const seed = await getSeed(latestChainData, dbTx);

        await saveLastBlock.run(
          {
            block_height: latestChainData.blockNumber,
            main_chain_block_hash: Buffer.from(strip0x(latestChainData.blockHash), 'hex'),
            ms_timestamp: new Date(latestChainData.timestamp * 1000),
            ver: 1,
            seed: seed,
          },
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
          // recall: there are two types of primitives
          //         1. Those that explicitly trigger an STF call
          //         2. Those that modify DB (ledger) state directly
          // primitives that only modify ledger state do not affect the block hash (industry standard)
          // and those that trigger STF calls are taken into account later
          cdeDataLength += await processCdeData(
            latestChainData.blockNumber,
            network,
            extensionsPerNetwork[network],
            dbTx,
            false
          );
        }

        await processInternalEvents(latestChainData.internalEvents, dbTx);

        // Used to disambiguate when two primitives have events in the same tx. This
        // means the hash depends on the order we process the primitives (which is the
        // order in the configuration).
        // note: this means that events triggered by the same tx may, in some cases, not be consecutive.
        const indexPerTx = new Map();

        // This is shared across processScheduledData and processUserInputs in
        // case a primitive is triggered in the same tx as an input is
        // submitted, otherwise there would be a collision.
        const indexForEventByTx = (txHash: string): number => {
          let index = 0;

          if (indexPerTx.has(txHash)) {
            index = indexPerTx.get(txHash)! + 1;
          }

          indexPerTx.set(txHash, index);
          return index;
        };

        // TODO: as a pref improvement, we should probably track this in-memory and only query the DB when needed
        const [prevBlock] = await getLatestProcessedBlockHeight.run(undefined, dbTx);

        // Fetch and execute scheduled input data
        const scheduledDataTxHashes = await processScheduledData(
          latestChainData,
          dbTx,
          gameStateTransition,
          randomnessGenerator,
          precompiles.precompiles,
          indexForEventByTx,
          events,
          prevBlock?.paima_block_hash
        );

        // Execute user submitted input data
        const userInputsTxHashes = await processUserInputs(
          latestChainData,
          dbTx,
          gameStateTransition,
          randomnessGenerator,
          indexForEventByTx,
          scheduledDataTxHashes.successTxHashes.length +
            scheduledDataTxHashes.failedTxHashes.length,
          events,
          prevBlock?.paima_block_hash
        );

        const processedCount =
          userInputsTxHashes.successTxHashes.length + scheduledDataTxHashes.successTxHashes.length;
        // Extra logging
        if (processedCount > 0)
          doLog(
            `Processed ${userInputsTxHashes.successTxHashes.length} user inputs, ${scheduledDataTxHashes.successTxHashes.length} scheduled inputs and ${cdeDataLength} CDE events in block #${latestChainData.blockNumber}`
          );

        // Commit finishing of processing to DB

        const blockHeader = genV1BlockHeader(
          {
            blockHash: strip0x(latestChainData.blockHash),
            blockHeight: latestChainData.blockNumber,
            msTimestamp: latestChainData.timestamp * 1000,
          },
          prevBlock?.paima_block_hash == null ? null : prevBlock.paima_block_hash.toString('hex'),
          // recall: scheduled data always executes before user data, so tx hashes are in the same order
          [...scheduledDataTxHashes.successTxHashes, ...userInputsTxHashes.successTxHashes],
          [...scheduledDataTxHashes.failedTxHashes, ...userInputsTxHashes.failedTxHashes]
        );
        const blockHash = hashBlock.hash(blockHeader);
        await blockHeightDone.run(
          { block_height: latestChainData.blockNumber, block_hash: Buffer.from(blockHash, 'hex') },
          dbTx
        );
        return processedCount;
      },
      getAppEvents(): ReturnType<typeof generateAppEvents> {
        return events;
      },
    };
  },
};

/**
 * We need to process all the SQL calls of an STF update in an all-or-nothing manner
 * STF updates can fail (since the data for them comes from arbitrary onchain data)
 * But we can't allow a single user's bad transaction to DOS the game for everybody else
 * So failures should be isolated to just the specific input, and not the full block
 * (recall: without this, in psql, if a query fails during a db transaction, the entire dbTx becomes invalid)
 */
async function tryOrRollback<T>(dbTx: PoolClient, func: () => Promise<T>): Promise<undefined | T> {
  const checkpointName = `game_state_transition`;
  await dbTx.query(`SAVEPOINT ${checkpointName}`);
  try {
    return await func();
  } catch (err) {
    await dbTx.query(`ROLLBACK TO SAVEPOINT ${checkpointName}`);
    doLog(`[paima-sm] Database error on ${checkpointName}. Rolling back.`, err);
    return undefined;
  } finally {
    await dbTx.query(`RELEASE SAVEPOINT ${checkpointName}`);
  }
}

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
  const [mainNetwork, _] = await GlobalConfig.mainConfig();
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

async function processPaginatedCdeData(
  paginationCursor: { cdeName: string; cursor: string; finished: boolean },
  cdeData: ChainDataExtensionDatum[] | undefined,
  dbTx: PoolClient,
  inPresync: boolean
): Promise<number> {
  return await processCdeDataBase(cdeData, dbTx, inPresync, async () => {
    await updatePaginationCursor.run(
      {
        cde_name: paginationCursor.cdeName,
        cursor: paginationCursor.cursor,
        finished: paginationCursor.finished,
      },
      dbTx
    );

    return;
  });
}

// Process all of the scheduled data inputs by running each of them through the game STF,
// saving the results to the DB, and deleting the schedule data all together in one postgres tx.
// Function returns number of scheduled inputs that were processed.
async function processScheduledData<Events extends AppEvents>(
  latestChainData: ChainData,
  DBConn: PoolClient,
  gameStateTransition: GameStateTransitionFunction<Events>,
  randomnessGenerator: Prando,
  precompiles: Precompiles['precompiles'],
  indexForEvent: (txHash: string) => number,
  eventDefinitions: ReturnType<typeof generateAppEvents>,
  prevBlockHash: null | Buffer
): Promise<TxHashes> {
  const scheduledData = await getScheduledDataByBlockHeight.run(
    { block_height: latestChainData.blockNumber },
    DBConn
  );

  // just in case there are two timers in the same block with the same exact contents.
  let timerIndexRelativeToBlock = -1;

  const networks = await GlobalConfig.getInstance();

  // Note: this is not related to `indexForEvent`, since that one is used to
  // keep a counter of the original tx that scheduled the input. This is just a
  // global counter for the current block, so we can just increase it by one
  // with each event.
  let txIndexInBlock = 0;

  const resultingHashes: TxHashes = {
    successTxHashes: [],
    failedTxHashes: [],
  };
  for (const data of scheduledData) {
    const userAddress = data.precompile ? precompiles[data.precompile] : SCHEDULED_DATA_ADDRESS;

    if (data.precompile && !precompiles[data.precompile]) {
      doLog(`[paima-sm] Precompile for scheduled event not found ${data.precompile}. Skipping.`);
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-loop-func -- incorrect error fixed when @typescript-eslint v8 comes out
    const { txHash, caip2 } = ((): { txHash: string; caip2: null | string } => {
      if (data.cde_name && data.tx_hash) {
        const caip2Prefix = caip2PrefixFor(networks[data.network!]);

        return {
          caip2: caip2PrefixFor(networks[data.network!]),
          txHash: hashSubmittedData.hash({
            caip2Prefix,
            txHash: data.tx_hash,
            indexInBlock: indexForEvent(data.tx_hash),
          }),
        };
      } else {
        // it has to be an scheduled timer if we don't have a cde_name
        timerIndexRelativeToBlock += 1;

        return {
          txHash: hashTimerData.hash({
            address: userAddress,
            dataHash: keccak_256(data.input_data),
            blockHeight: latestChainData.blockNumber,
            indexInBlock: timerIndexRelativeToBlock,
          }),
          // if there is a timer, there is not really a way to associate it with a particular network
          caip2: null,
        };
      }
    })();
    try {
      const inputData: STFSubmittedData = {
        userId: SCHEDULED_DATA_ID,
        realAddress: SCHEDULED_DATA_ADDRESS,
        userAddress: userAddress,
        inputData: data.input_data,
        inputNonce: '',
        suppliedValue: '0',
        scheduled: true,
        txHash,
        caip2: caip2,
      };

      if (data.tx_hash) {
        inputData.scheduledTxHash = data.tx_hash;
      }

      if (data.cde_name) {
        inputData.extensionName = data.cde_name;
      }

      // Trigger STF
      let sqlQueries: SQLUpdate[] = [];
      let eventsToEmit: EventsToEmit<Events[string][number]> = [];
      try {
        const { stateTransitions, events } = await gameStateTransition(
          inputData,
          {
            version: 1,
            mainChainBlochHash: strip0x(latestChainData.blockHash),
            blockHeight: data.block_height,
            prevBlockHash: prevBlockHash == null ? null : prevBlockHash.toString('hex'),
            msTimestamp: latestChainData.timestamp * 1000,
          },
          randomnessGenerator,
          DBConn
        );

        sqlQueries = stateTransitions;

        handleEvents<Events[string][number]>(
          events,
          sqlQueries,
          txIndexInBlock,
          latestChainData,
          eventDefinitions,
          eventsToEmit
        );
      } catch (err) {
        // skip scheduled data where the STF fails
        doLog(`[paima-sm] Error on scheduled data STF call. Skipping`, err);
        continue;
      }
      if (sqlQueries.length !== 0) {
        const success = await tryOrRollback(DBConn, async () => {
          for (const [query, params] of sqlQueries) {
            await query.run(params, DBConn);
          }

          return true;
        });

        if (success) {
          await sendEventsToBroker<Events[string][number]>(eventsToEmit);
          resultingHashes.successTxHashes.push(txHash);
        } else {
          resultingHashes.failedTxHashes.push(txHash);
        }
      }
    } catch (e) {
      resultingHashes.failedTxHashes.push(txHash);
      logError(e);
      throw e;
    } finally {
      // guarantee we run this no matter if there is an error or a continue
      await deleteScheduled.run({ id: data.id }, DBConn);
      txIndexInBlock += 1;
    }
  }
  return resultingHashes;
}

// Process all of the user inputs data inputs by running each of them through the game STF,
// saving the results to the DB with the nonces, all together in one postgres tx.
// Function returns number of user inputs that were processed.
async function processUserInputs<Events extends AppEvents>(
  latestChainData: ChainData,
  DBConn: PoolClient,
  gameStateTransition: GameStateTransitionFunction<Events>,
  randomnessGenerator: Prando,
  indexForEvent: (txHash: string) => number,
  txIndexInBlock: number,
  eventDefinitions: ReturnType<typeof generateAppEvents>,
  prevBlockHash: null | Buffer
): Promise<TxHashes> {
  const resultingHashes: TxHashes = {
    successTxHashes: [],
    failedTxHashes: [],
  };

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

    const txHash = hashSubmittedData.hash({
      caip2Prefix: submittedData.caip2!,
      txHash: submittedData.txHash,
      indexInBlock: indexForEvent(submittedData.txHash),
    });
    const inputData: STFSubmittedData = {
      ...submittedData,
      userAddress: address.address,
      userId: address.id,
      txHash,
    };
    try {
      // Check if internal Concise Command
      // Internal Concise Commands are prefixed with an ampersand (&)
      //
      // delegate       = &wd|from?|to?|from_signature|to_signature
      // migrate        = &wm|from?|to?|from_signature|to_signature
      // cancelDelegate = &wc|to?
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
      let sqlQueries: SQLUpdate[] = [];
      let eventsToEmit: EventsToEmit<Events[string][number]> = [];
      try {
        const { stateTransitions, events } = await gameStateTransition(
          inputData,
          {
            version: 1,
            mainChainBlochHash: strip0x(latestChainData.blockHash),
            prevBlockHash: prevBlockHash == null ? null : prevBlockHash.toString('hex'),
            blockHeight: latestChainData.blockNumber,
            msTimestamp: latestChainData.timestamp * 1000,
          },
          randomnessGenerator,
          DBConn
        );

        sqlQueries = stateTransitions;

        handleEvents<Events[string][number]>(
          events,
          sqlQueries,
          txIndexInBlock,
          latestChainData,
          eventDefinitions,
          eventsToEmit
        );
      } catch (err) {
        // skip inputs where the STF fails
        doLog(`[paima-sm] Error on user input STF call. Skipping`, err);
        continue;
      }
      if (sqlQueries.length !== 0) {
        const success = await tryOrRollback(DBConn, async () => {
          for (const [query, params] of sqlQueries) {
            await query.run(params, DBConn);
          }

          return true;
        });

        if (success) {
          await sendEventsToBroker<Events[string][number]>(eventsToEmit);
          resultingHashes.successTxHashes.push(txHash);
        } else {
          resultingHashes.failedTxHashes.push(txHash);
        }
      }
    } catch (e) {
      resultingHashes.failedTxHashes.push(txHash);
      throw e;
    } finally {
      txIndexInBlock += 1;
      // guarantee we run this no matter if there is an error or a continue
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
    }
  }
  return resultingHashes;
}

async function sendEventsToBroker<Event extends EventPathAndDef>(
  eventsToEmit: EventsToEmit<Event>
): Promise<void> {
  if (ENV.MQTT_BROKER) {
    // we probably don't want to use Promise.all since it will change the order.
    for (const [eventDefinition, fields] of eventsToEmit) {
      await PaimaEventManager.Instance.sendMessage(eventDefinition, fields);
    }
  }
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
      case InternalEventType.AvailLastBlock:
      case InternalEventType.EvmLastBlock:
        await markCdeBlockheightProcessed.run(
          {
            block_height: event.block,
            network: event.network,
          },
          dbTx
        );
        break;
      case InternalEventType.MinaLastTimestamp:
        await updateMinaCheckpoint.run(
          {
            timestamp: event.timestamp,
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

type EventsToEmit<Event extends EventPathAndDef> = [
  ValueOf<ReturnType<typeof generateAppEvents>>[0],
  ResolvedPath<Event['path']> & Event['type'],
][];

function handleEvents<Event extends EventPathAndDef>(
  events: {
    address: `0x${string}`;
    data: { name: string; fields: ResolvedPath<Event['path']> & Event['type']; topic: string };
  }[],
  sqlQueries: SQLUpdate[],
  txIndexInBlock: number,
  latestChainData: ChainData,
  eventDefinitions: ReturnType<typeof generateAppEvents>,
  eventsToEmit: EventsToEmit<Event>
): void {
  for (let log_index = 0; log_index < events.length; log_index++) {
    const event = events[log_index];
    sqlQueries.push([
      insertEvent,
      {
        topic: event.data.topic,
        address: event.address,
        data: event.data.fields,
        tx: txIndexInBlock,
        log_index,
        block_height: latestChainData.blockNumber,
      },
    ]);

    const eventDefinition = eventDefinitions[event.data.name].find(
      eventDefinition => eventDefinition.topicHash === event.data.topic
    );

    if (!eventDefinition) {
      throw new Error('Event definition not found');
    }

    eventsToEmit.push([eventDefinition, event.data.fields]);
  }
}

export default SM;
