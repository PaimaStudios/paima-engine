import { doLog, logError, ENV, delay } from '@paima/utils';
import type { ChainData, ChainFunnel } from '@paima/utils';
import { DataMigrations } from '@paima/db';
import type { GameStateMachine } from '@paima/db';
import { getEarliestStartBlockheight } from '@paima/utils-backend';
import process from 'process';

import { run } from './run-flag';
import { snapshotIfTime } from './snapshots.js';
import { acquireLatestBlockHeight, exitIfStopped, loopIfStopBlockReached } from './utils';

// The core logic of paima runtime which polls the funnel and processes the resulting chain data using the game's state machine.
// Of note, the runtime is designed to continue running/attempting to process the next required block no matter what errors propagate upwards.
// This is a good approach in the case of networking problems or other edge cases which address themselves over time, and ensuring that the game node never goes offline.
// However of note, it is possible for the game node to get into a "soft-lock" state if the game state machine is badly coded and has uncaught exceptions which cause
// the runtime to continuously retry syncing the same block, and failing each time.
export async function startRuntime(
  gameStateMachine: GameStateMachine,
  chainFunnel: ChainFunnel,
  pollingRate: number,
  presyncStepSize: number,
  startBlockHeight: number,
  stopBlockHeight: number | null
): Promise<void> {
  const pollingPeriod = pollingRate * 1000;

  // Presync:
  await runPresync(
    gameStateMachine,
    chainFunnel,
    pollingPeriod,
    presyncStepSize,
    startBlockHeight,
    stopBlockHeight
  );

  // Main sync:
  await runSync(gameStateMachine, chainFunnel, pollingPeriod, stopBlockHeight);

  process.exit(0);
}

async function runPresync(
  gameStateMachine: GameStateMachine,
  chainFunnel: ChainFunnel,
  pollingPeriod: number,
  stepSize: number,
  startBlockHeight: number,
  stopBlockHeight: number | null
): Promise<void> {
  const maximumPresyncBlockheight = stopBlockHeight
    ? Math.min(startBlockHeight, stopBlockHeight)
    : startBlockHeight;
  let presyncBlockHeight = await getPresyncStartBlockheight(
    gameStateMachine,
    chainFunnel,
    startBlockHeight,
    maximumPresyncBlockheight
  );

  if (presyncBlockHeight > maximumPresyncBlockheight) {
    doLog(
      `[paima-runtime] Skipping presync (presync block height: ${presyncBlockHeight}, maximum presync block height: ${startBlockHeight})`
    );
    return;
  }

  if (run) {
    doLog(
      '-------------------------------------\nBeginning Presync\n-------------------------------------'
    );
  }
  while (run && presyncBlockHeight <= maximumPresyncBlockheight) {
    const upper = Math.min(presyncBlockHeight + stepSize - 1, maximumPresyncBlockheight);
    if (upper > presyncBlockHeight) {
      doLog(`p${presyncBlockHeight}-${upper}`);
    } else {
      doLog(`p${presyncBlockHeight}`);
    }

    presyncBlockHeight = await runPresyncRound(
      gameStateMachine,
      chainFunnel,
      pollingPeriod,
      presyncBlockHeight,
      upper
    );
  }
  await loopIfStopBlockReached(presyncBlockHeight, stopBlockHeight);
  doLog(`[paima-runtime] Presync finished at ${presyncBlockHeight}`);
}

async function getPresyncStartBlockheight(
  gameStateMachine: GameStateMachine,
  chainFunnel: ChainFunnel,
  startBlockHeight: number,
  maximumPresyncBlockheight: number
): Promise<number> {
  const earliestCdeSbh = getEarliestStartBlockheight(chainFunnel.getExtensions());
  const freshPresyncStart = earliestCdeSbh >= 0 ? earliestCdeSbh : maximumPresyncBlockheight + 1;
  const latestSyncBlockheight = await gameStateMachine.latestProcessedBlockHeight();

  if (freshPresyncStart > maximumPresyncBlockheight || latestSyncBlockheight > startBlockHeight) {
    // No need for presync:
    return maximumPresyncBlockheight + 1;
  }

  const latestPresyncBlockheight = await gameStateMachine.getPresyncBlockHeight();
  if (latestPresyncBlockheight > 0) {
    // Continue previously unfinished presync:
    return latestPresyncBlockheight + 1;
  } else {
    // Start fresh presync:
    return freshPresyncStart;
  }
}

async function runPresyncRound(
  gameStateMachine: GameStateMachine,
  chainFunnel: ChainFunnel,
  pollingPeriod: number,
  fromBlock: number,
  toBlock: number
): Promise<number> {
  const latestPresyncDataList = await chainFunnel.readPresyncData(fromBlock, toBlock);
  if (!latestPresyncDataList || latestPresyncDataList.length === 0) {
    await delay(pollingPeriod);
    return fromBlock;
  }
  const filteredPresyncDataList = latestPresyncDataList.filter(
    unit => unit.extensionDatums.length > 0
  );
  for (const presyncData of filteredPresyncDataList) {
    await gameStateMachine.presyncProcess(presyncData);
  }
  return toBlock + 1;
}

async function runSync(
  gameStateMachine: GameStateMachine,
  chainFunnel: ChainFunnel,
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
    const latestProcessedBlockHeight = await getSyncRoundStart(
      gameStateMachine,
      pollingPeriod,
      stopBlockHeight
    );
    if (latestProcessedBlockHeight < 0) {
      continue;
    }

    // Fetching new chain data via the funnel
    const latestChainDataList = await getSyncRoundData(
      chainFunnel,
      pollingPeriod,
      latestProcessedBlockHeight
    );
    if (latestChainDataList.length === 0) {
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
    return [];
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

  // Before processing -- sanity check of block height:
  if (!(await blockPreProcess(gameStateMachine, chainData.blockNumber, pollingPeriod))) {
    return false;
  }

  // Processing proper -- data migrations and passing chain data to SM
  if (!(await blockCoreProcess(gameStateMachine, chainData))) {
    return false;
  }

  // After processing -- checking
  if (!(await blockPostProcess(gameStateMachine, chainData.blockNumber, stopBlockHeight))) {
    return false;
  }

  return true;
}

async function blockPreProcess(
  gameStateMachine: GameStateMachine,
  blockNumber: number,
  pollingPeriod: number
): Promise<boolean> {
  try {
    const latestReadBlockHeight = await acquireLatestBlockHeight(gameStateMachine, pollingPeriod);
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
  gameStateMachine: GameStateMachine,
  chainData: ChainData
): Promise<boolean> {
  try {
    if (DataMigrations.hasPendingMigration(chainData.blockNumber)) {
      await DataMigrations.applyDataDBMigrations(chainData.blockNumber);
    }
    await gameStateMachine.process(chainData);
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
