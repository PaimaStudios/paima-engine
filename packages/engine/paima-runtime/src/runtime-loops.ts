import process from 'process';
import { doLog, logError, delay, ENV, GlobalConfig } from '@paima/utils';
import { tx, DataMigrations } from '@paima/db';
import { getEarliestStartBlockheight, getEarliestStartSlot } from './cde-config/utils.js';
import type { ChainFunnel, IFunnelFactory, ReadPresyncDataFrom } from './types.js';
import type { ChainData, ChainDataExtension, GameStateMachine } from '@paima/sm';
import { run } from './run-flag.js';
import { snapshotIfTime } from './snapshots.js';
import {
  TimeoutError,
  acquireLatestBlockHeight,
  exitIfStopped,
  loopIfStopBlockReached,
} from './utils.js';
import { cleanNoncesIfTime } from './nonce-gc.js';
import type { PoolClient } from 'pg';
import { FUNNEL_PRESYNC_FINISHED, ConfigNetworkType } from '@paima/utils';
import type { CardanoConfig, EvmConfig } from '@paima/utils';

// The core logic of paima runtime which polls the funnel and processes the resulting chain data using the game's state machine.
// Of note, the runtime is designed to continue running/attempting to process the next required block no matter what errors propagate upwards.
// This is a good approach in the case of networking problems or other edge cases which address themselves over time, and ensuring that the game node never goes offline.
// However of note, it is possible for the game node to get into a "soft-lock" state if the game state machine is badly coded and has uncaught exceptions which cause
// the runtime to continuously retry syncing the same block, and failing each time.
export async function startRuntime(
  gameStateMachine: GameStateMachine,
  funnelFactory: IFunnelFactory,
  pollingRate: number,
  startBlockHeight: number,
  stopBlockHeight: number | null,
  emulatedBlocks: boolean
): Promise<void> {
  const pollingPeriod = pollingRate * 1000;

  // Presync:
  await runPresync(
    gameStateMachine,
    funnelFactory,
    pollingPeriod,
    startBlockHeight,
    emulatedBlocks ? null : stopBlockHeight
  );

  // Main sync:
  await runSync(gameStateMachine, funnelFactory, pollingPeriod, stopBlockHeight);

  process.exit(0);
}

async function runPresync(
  gameStateMachine: GameStateMachine,
  funnelFactory: IFunnelFactory,
  pollingPeriod: number,
  startBlockHeight: number,
  stopBlockHeight: number | null
): Promise<void> {
  const networks = await GlobalConfig.getInstance();

  const cardanoConfig = await GlobalConfig.cardanoConfig();

  let presyncBlockHeight = await getPresyncStartBlockheight(
    gameStateMachine,
    funnelFactory.getExtensions(),
    startBlockHeight,
    cardanoConfig
  );

  if (run) {
    doLog('---------------------------\nBeginning Presync\n---------------------------');
  }
  while (run && Object.keys(presyncBlockHeight).length !== 0) {
    const upper = Object.fromEntries(
      Object.entries(presyncBlockHeight)
        .filter(([_network, h]) => h >= 0)
        .map(([network, h]) => [
          network,
          h + (networks[network] as EvmConfig | CardanoConfig).presyncStepSize - 1,
        ])
    );

    for (const network of Object.keys(networks)) {
      if (upper[network] > presyncBlockHeight[network]) {
        doLog(
          `[paima-runtime] Fetching data from ${network} in range: ${presyncBlockHeight[network]}-${upper[network]}`
        );
      } else if (presyncBlockHeight[network]) {
        doLog(
          `[paima-runtime] Fetching data from ${network} in block: ${presyncBlockHeight[network]}`
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-loop-func
    presyncBlockHeight = await tx(gameStateMachine.getReadWriteDbConn(), async dbTx => {
      const chainFunnel = await funnelFactory.generateFunnel(dbTx);
      return await runPresyncRound(
        gameStateMachine,
        chainFunnel,
        pollingPeriod,
        Object.entries(presyncBlockHeight).map(([network, height]) => ({
          network: network,
          from: height,
          to: upper[network],
        }))
      );
    });
  }

  for (const network of Object.keys(networks)) {
    await loopIfStopBlockReached(presyncBlockHeight[network], stopBlockHeight);

    const latestPresyncBlockheight = await gameStateMachine.getPresyncBlockHeight(network);
    doLog(`[paima-runtime] Presync for ${network} finished at ${latestPresyncBlockheight}`);
  }

  const latestPresyncSlotHeight = await gameStateMachine.getPresyncCardanoSlotHeight();
  if (latestPresyncSlotHeight > 0) {
    doLog(`[paima-runtime] Cardano presync finished at ${latestPresyncSlotHeight}`);
  }
}

async function getPresyncStartBlockheight(
  gameStateMachine: GameStateMachine,
  CDEs: ChainDataExtension[],
  maximumPresyncBlockheight: number,
  cardanoConfig: [string, CardanoConfig] | undefined
): Promise<{ [network: string]: number }> {
  const config = await GlobalConfig.getInstance();

  const result: { [network: string]: number } = {};

  for (const network of Object.keys(config)) {
    if (config[network].type === ConfigNetworkType.CARDANO) {
      continue;
    }

    const earliestCdeSbh = getEarliestStartBlockheight(CDEs, network);

    const freshPresyncStart = earliestCdeSbh >= 0 ? earliestCdeSbh : maximumPresyncBlockheight + 1;

    result[network] = freshPresyncStart;

    const latestPresyncBlockheight = await gameStateMachine.getPresyncBlockHeight(network);

    if (latestPresyncBlockheight > 0) {
      result[network] = latestPresyncBlockheight + 1;
    }
  }

  if (cardanoConfig) {
    const earliestCdeCardanoSlot = getEarliestStartSlot(CDEs);

    const latestPresyncSlotHeight = await gameStateMachine.getPresyncCardanoSlotHeight();

    result[cardanoConfig[0]] = earliestCdeCardanoSlot;

    if (latestPresyncSlotHeight > 0) {
      result[cardanoConfig[0]] = latestPresyncSlotHeight + 1;
    }
  }

  return result;
}

async function runPresyncRound(
  gameStateMachine: GameStateMachine,
  chainFunnel: ChainFunnel,
  pollingPeriod: number,
  from: ReadPresyncDataFrom
): Promise<{ [network: string]: number }> {
  const latestPresyncDataList = await chainFunnel.readPresyncData(from);

  if (!latestPresyncDataList || Object.values(latestPresyncDataList).every(l => l.length === 0)) {
    await delay(pollingPeriod);
    return Object.fromEntries(from.map(({ network, from }) => [network, from])) as Record<
      string,
      number
    >;
  }

  const filteredPresyncDataList = Object.values(latestPresyncDataList)
    .flatMap(data => (data !== FUNNEL_PRESYNC_FINISHED ? data : []))
    .filter(unit => unit.extensionDatums.length > 0);

  const dbTx = chainFunnel.getDbTx();

  for (const presyncData of filteredPresyncDataList) {
    await gameStateMachine.presyncProcess(dbTx, presyncData);
  }

  // TODO: use the non-hardcoded name
  const cardanoFrom = from.find(arg => arg.network === 'cardano');
  if (cardanoFrom) {
    await gameStateMachine.markCardanoPresyncMilestone(dbTx, cardanoFrom.to);
  }

  return Object.fromEntries(
    from
      .filter(arg => latestPresyncDataList[arg.network] !== FUNNEL_PRESYNC_FINISHED)
      .map(arg => [arg.network, arg.to + 1])
  );
}

async function runSync(
  gameStateMachine: GameStateMachine,
  funnelFactory: IFunnelFactory,
  pollingPeriod: number,
  stopBlockHeight: number | null
): Promise<void> {
  if (run) {
    doLog(
      '-------------------------------------\nBeginning Syncing & Processing Blocks\n-------------------------------------'
    );
  }
  while (run) {
    // Initializing the latest read block height and snapshotting
    // do not use a DB transaction, as we need to generate a snapshot
    const latestProcessedBlockHeight = await getSyncRoundStart(
      gameStateMachine,
      pollingPeriod,
      stopBlockHeight
    );
    if (latestProcessedBlockHeight < 0) {
      continue;
    }

    const latestChainDataList: ChainData[] = [];
    try {
      // Fetching new chain data via the funnel
      // note: this is done in a separate SQL transaction from actually applying the data
      latestChainDataList.push(
        ...(await tx<ChainData[]>(gameStateMachine.getReadWriteDbConn(), async dbTx => {
          const chainFunnel = await funnelFactory.generateFunnel(dbTx);
          return await getSyncRoundData(chainFunnel, pollingPeriod, latestProcessedBlockHeight);
        }))
      );
      if (latestChainDataList.length === 0) {
        continue;
      }
    } catch (err) {
      doLog('[paima-runtime] Funnel failure:');
      logError(err);
      // delete any cache entires as they may have been partially applied before the crash
      funnelFactory.clearCache();
      // delay before retrying to avoid getting rate limited by any remote call in a funnel
      if (err instanceof TimeoutError) {
        await delay(err.timeout);
      } else {
        await delay(2000);
      }

      continue;
    }

    // Iterate through all of the returned chainData and process each one via the state machine's STF
    try {
      for (const chainData of latestChainDataList) {
        if (
          !(await processSyncBlockData(gameStateMachine, chainData, pollingPeriod, stopBlockHeight))
        ) {
          break;
        }
      }
    } catch (err) {
      doLog('[paima-runtime] Uncaught error propagated to runtime while processing chain data:');
      logError(err);
      // delete any cache entires as they may have been partially applied before the crash
      funnelFactory.clearCache();
      continue;
    }
  }
}

async function getSyncRoundStart(
  gameStateMachine: GameStateMachine,
  pollingPeriod: number,
  stopBlockHeight: number | null
): Promise<number> {
  try {
    const latestProcessedBlockHeight = await acquireLatestBlockHeight(
      gameStateMachine,
      pollingPeriod
    );
    await cleanNoncesIfTime(gameStateMachine.getReadWriteDbConn(), latestProcessedBlockHeight);
    await snapshotIfTime(latestProcessedBlockHeight);
    await loopIfStopBlockReached(latestProcessedBlockHeight, stopBlockHeight);
    exitIfStopped(run);
    return latestProcessedBlockHeight;
  } catch (err) {
    doLog('[paima-runtime] Error in pre-funnel phase:');
    logError(err);
    return -1;
  }
}

async function getSyncRoundData(
  chainFunnel: ChainFunnel,
  pollingPeriod: number,
  latestProcessedBlockHeight: number
): Promise<ChainData[]> {
  try {
    const latestChainDataList = await chainFunnel.readData(latestProcessedBlockHeight + 1);
    exitIfStopped(run);

    // If no new chain data, delay for the duration of the pollingPeriod
    if (!latestChainDataList || !latestChainDataList?.length) {
      await delay(pollingPeriod);
      return [];
    }

    return latestChainDataList;
  } catch (err) {
    doLog('[paima-runtime] Error received from the funnel:');
    logError(err);
    throw err;
  }
}

async function processSyncBlockData(
  gameStateMachine: GameStateMachine,
  chainData: ChainData,
  pollingPeriod: number,
  stopBlockHeight: number | null
): Promise<boolean> {
  // Checking if should safely close in between processing blocks
  exitIfStopped(run);

  // note: every state machine update is its own SQL transaction
  // this is to ensure things like shutting down and taking snapshots properly sees SM updates
  const success = await tx<boolean>(gameStateMachine.getReadWriteDbConn(), async dbTx => {
    // Before processing -- sanity check of block height:
    if (!(await blockPreProcess(dbTx, gameStateMachine, chainData.blockNumber, pollingPeriod))) {
      return false;
    }

    // Processing proper -- data migrations and passing chain data to SM
    if (!(await blockCoreProcess(dbTx, gameStateMachine, chainData))) {
      return false;
    }

    return true;
  });
  if (!success) return false;

  // After processing -- checking
  if (!(await blockPostProcess(gameStateMachine, chainData.blockNumber, stopBlockHeight))) {
    return false;
  }

  return true;
}

async function blockPreProcess(
  dbTx: PoolClient,
  gameStateMachine: GameStateMachine,
  blockNumber: number,
  pollingPeriod: number
): Promise<boolean> {
  try {
    const latestReadBlockHeight = await acquireLatestBlockHeight(
      gameStateMachine,
      pollingPeriod,
      dbTx
    );
    if (blockNumber !== latestReadBlockHeight + 1) {
      doLog(`[paima-runtime] Block number ${blockNumber} encountered out of order!`);
      return false;
    }
  } catch (err) {
    doLog(`[paima-runtime] Error occurred prior to SM processing of block ${blockNumber}:`);
    logError(err);
    return false;
  }

  return true;
}

async function blockCoreProcess(
  dbTx: PoolClient,
  gameStateMachine: GameStateMachine,
  chainData: ChainData
): Promise<boolean> {
  try {
    if (DataMigrations.hasPendingMigrationForBlock(chainData.blockNumber)) {
      await DataMigrations.applyDataDBMigrations(dbTx, chainData.blockNumber);
    }
    await gameStateMachine.process(dbTx, chainData);
    exitIfStopped(run);
  } catch (err) {
    doLog(`[paima-runtime] Error occurred while SM processing of block ${chainData.blockNumber}:`);
    logError(err);
    return false;
  }

  return true;
}

async function blockPostProcess(
  gameStateMachine: GameStateMachine,
  blockNumber: number,
  stopBlockHeight: number | null
): Promise<boolean> {
  try {
    const latestReadBlockHeight = await gameStateMachine.latestProcessedBlockHeight();
    await snapshotIfTime(latestReadBlockHeight);
    exitIfStopped(run);
    await loopIfStopBlockReached(latestReadBlockHeight, stopBlockHeight);
  } catch (err) {
    doLog(`[paima-runtime] Error occurred after SM processing of block ${blockNumber}:`);
    logError(err);
    return false;
  }

  return true;
}
