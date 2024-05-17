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
  updateMinaCheckpoint,
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
  GameStateSubmittedDataReorderFunction,
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
          const gameRouter = gameStateTransitionRouter(blockHeight);
          const game: {
            stateTransition: GameStateTransitionFunction;
            submittedDataReordering: GameStateSubmittedDataReorderFunction;
          } =
            typeof gameRouter === 'function'
              ? {
                  stateTransition: gameRouter,
                  submittedDataReordering: undefined,
                }
              : {
                  stateTransition: gameRouter.stateTransition,
                  submittedDataReordering: gameRouter.submittedDataReordering,
                };
          const address = await getMainAddress(userAddress, dbTx);

          const submittedData: STFSubmittedData = {
            realAddress: userAddress,
            userAddress: address.address,
            userId: address.id,
            inputData: gameInput,
            inputNonce: '',
            suppliedValue: '0',
            scheduled: false,
            dryRun: true,
          };
          const data = await game.stateTransition(
            submittedData,
            blockHeight,
            new Prando('1234567890'),
            dbTx,
            {
              timestamp: 0,
              blockHash: '0x0',
              blockNumber: blockHeight,
              submittedData: [submittedData],
            }
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
        const gameRouter = gameStateTransitionRouter(latestChainData.blockNumber);
        const game: {
          stateTransition: GameStateTransitionFunction;
          submittedDataReordering: GameStateSubmittedDataReorderFunction;
        } =
          typeof gameRouter === 'function'
            ? {
                stateTransition: gameRouter,
                submittedDataReordering: undefined,
              }
            : {
                stateTransition: gameRouter.stateTransition,
                submittedDataReordering: gameRouter.submittedDataReordering,
              };

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
            game,
            randomnessGenerator
          );

          // Execute user submitted input data
          const userInputsLength = await processUserInputs(
            latestChainData,
            dbTx,
            game,
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

async function processPaginatedCdeData(
  paginationCursor: { cdeId: number; cursor: string; finished: boolean },
  cdeData: ChainDataExtensionDatum[] | undefined,
  dbTx: PoolClient,
  inPresync: boolean
): Promise<number> {
  return await processCdeDataBase(cdeData, dbTx, inPresync, async () => {
    await updatePaginationCursor.run(
      {
        cde_id: paginationCursor.cdeId,
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
async function processScheduledData(
  latestChainData: ChainData,
  DBConn: PoolClient,
  game: {
    stateTransition: GameStateTransitionFunction;
    submittedDataReordering: GameStateSubmittedDataReorderFunction;
  },
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
    const sqlQueries = await game.stateTransition(
      inputData,
      data.block_height,
      randomnessGenerator,
      DBConn,
      latestChainData
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

async function processSingleUserInput(
  submittedData: SubmittedData,
  latestChainData: ChainData,
  DBConn: PoolClient,
  game: {
    stateTransition: GameStateTransitionFunction;
    submittedDataReordering: GameStateSubmittedDataReorderFunction;
  },
  randomnessGenerator: Prando
): Promise<void> {
  // Check nonce is valid
  if (submittedData.inputNonce === '') {
    doLog(`Skipping inputData with invalid empty nonce: ${JSON.stringify(submittedData)}`);
    return;
  }
  const nonceData = await findNonce.run({ nonce: submittedData.inputNonce }, DBConn);
  if (nonceData.length > 0) {
    doLog(`Skipping inputData with duplicate nonce: ${JSON.stringify(submittedData)}`);
    return;
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
  // cancelDelegate = &wc|to?
  const delegateWallet = new DelegateWallet(DBConn);
  if (inputData.inputData.startsWith(DelegateWallet.INTERNAL_COMMAND_PREFIX)) {
    const status = await delegateWallet.process(
      inputData.realAddress,
      inputData.userAddress,
      inputData.inputData
    );
    if (!status) return;
  } else if (inputData.userId === NO_USER_ID) {
    // If wallet does not exist in address table: create it.
    const newAddress = await delegateWallet.createAddress(inputData.userAddress);
    inputData.userId = newAddress.id;
  }

  // Trigger STF
  const sqlQueries = await game.stateTransition(
    inputData,
    latestChainData.blockNumber,
    randomnessGenerator,
    DBConn,
    latestChainData
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

// Extract execution hints that define prerequisites for the execution.
// @x| -> execution hint for the address the sender
// z|*abc -> execution hint is the literal key 'abc'
// NOTE: @x and *wallet can match as the same address
function extractKeys(submittedData: SubmittedData): string[] {
  const keys = [];
  const args = submittedData.inputData.split('|');
  const header = args.shift() as string;
  if (header.match(/^@/)) {
    keys.push(submittedData.realAddress.toLocaleLowerCase());
  }
  args.forEach(arg => {
    if (arg.match(/^\*/)) {
      const key = arg.replace(/^\*/, '').toLocaleLowerCase();
      if (key) keys.push(key);
    }
  });
  return keys;
}

type ExecutionNode = {
  parents: ExecutionNode[];
  keys: string[];
  input: SubmittedData | null;
  children: ExecutionNode[];
  executed: boolean;
};
type BlockingLeaf = { key: string; node: ExecutionNode };

/* Generate a serial tree (list) of execution nodes based on the submitted data. */
function generateSerialExecutionTree(latestChainData: ChainData): ExecutionNode {
  const treeRoot: ExecutionNode = {
    parents: [],
    keys: [],
    input: null, // root has not input
    children: [],
    executed: false,
  };
  let currentNode = treeRoot;
  for (const submittedData of latestChainData.submittedData) {
    const node: ExecutionNode = {
      keys: extractKeys(submittedData),
      input: submittedData,
      children: [],
      parents: [currentNode],
      executed: false,
    };
    currentNode.children = [node];
    currentNode = node;
  }
  return treeRoot;
}

/* Generate a parallel tree of execution nodes based on the submitted data. */
function generateParallelExecutionTree(latestChainData: ChainData): ExecutionNode {
  const treeRoot: ExecutionNode = {
    parents: [],
    keys: [],
    input: null, // root has not input
    children: [],
    executed: false,
  };

  const treeEndNodes: BlockingLeaf[] = [];
  for (const submittedData of latestChainData.submittedData) {
    const keys = extractKeys(submittedData);
    const node: ExecutionNode = {
      keys,
      input: submittedData,
      children: [],
      parents: [],
      executed: false,
    };

    if (!keys.length) {
      node.parents = [treeRoot];
      treeRoot.children.push(node);
    } else {
      const blocked = node.keys
        .map(k => treeEndNodes.find(e => e.key === k))
        .filter((e): e is BlockingLeaf => !!e);
      const newKeys = node.keys
        .map(k => (treeEndNodes.find(e => e.key === k) ? null : k))
        .filter((k): k is string => !!k);

      newKeys.forEach(k => treeEndNodes.push({ key: k, node }));
      if (!blocked.length) {
        node.parents = [treeRoot];
        treeRoot.children.push(node);
      } else {
        node.parents = blocked.map(b => b && b.node).filter((b): b is ExecutionNode => !!b);
        blocked.forEach(b => {
          b.node.children.push(node);
          b.node = node; // move pointer to new node
        });
      }
    }
  }
  return treeRoot;
}

/* Return the tree info in reference array. */
function printTree(node: ExecutionNode, depth: number, logRef: string[]): void {
  if (node.input) {
    const data = node.input.inputData;
    const key = node.keys.length ? `(${node.keys.join(',')})` : '';
    logRef.push(`|${'  '.repeat(depth)} ${data} ${key}`);
  }
  node.children.forEach(c => printTree(c, depth + 1, logRef));
}

// Process all of the user inputs data inputs by running each of them through the game STF,
// saving the results to the DB with the nonces, all together in one postgres tx.
// Function returns number of user inputs that were processed.
async function processUserInputs(
  latestChainData: ChainData,
  DBConn: PoolClient,
  game: {
    stateTransition: GameStateTransitionFunction;
    submittedDataReordering: GameStateSubmittedDataReorderFunction;
  },
  randomnessGenerator: Prando
): Promise<number> {
  /** TODO CUSTOM GAME REORDERING OF INPUTS */
  if (game.submittedDataReordering && latestChainData.submittedData.length) {
    latestChainData.submittedData = await game.submittedDataReordering(latestChainData, DBConn);
  }

  const mode = ENV.GAME_STF_EXECUTION_MODE;
  const executionTree =
    mode === 'parallel'
      ? generateParallelExecutionTree(latestChainData)
      : generateSerialExecutionTree(latestChainData);

  const logs: string[] = [];
  printTree(executionTree, 0, logs);
  if (logs.length) {
    doLog(`${'-'.repeat(40)}\n| Execution Plan (${mode}):\n${logs.join('\n')}\n${'-'.repeat(40)}`);
  }

  const processNode = (targetNode: ExecutionNode): ExecutionNode[] => {
    let currentStepNodes: ExecutionNode[] = [];
    targetNode.children.forEach(node => {
      if (node.executed) return;
      if (node.parents.every(p => p.executed)) {
        currentStepNodes.push(node);
        node.executed = true;
      }
    });
    return currentStepNodes;
  };

  // mark root as executed.
  // no command is stored in the root node.
  executionTree.executed = true;
  let step = [executionTree];
  while (step.length) {
    const run: ExecutionNode[] = [];
    step.forEach(node => {
      run.push(...processNode(node));
    });
    await Promise.all(
      run.map(node => {
        doLog('Processing:', node.input);
        return processSingleUserInput(
          node.input as SubmittedData,
          latestChainData,
          DBConn,
          game,
          randomnessGenerator
        );
      })
    );
    step = run;
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

export default SM;
