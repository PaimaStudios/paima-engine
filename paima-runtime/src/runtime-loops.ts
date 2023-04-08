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
  stopBlockHeight: number | null
): Promise<void> {
  const pollingPeriod = pollingRate * 1000;

  // Presync:
  const earliestCdeSbh = getEarliestStartBlockheight(chainFunnel.getExtensions());
  const presyncStart = earliestCdeSbh >= 0 ? earliestCdeSbh : ENV.START_BLOCKHEIGHT + 1;
  const syncMark = await acquireLatestBlockHeight(gameStateMachine, pollingPeriod);

  if (syncMark <= ENV.START_BLOCKHEIGHT + 1 && presyncStart <= ENV.START_BLOCKHEIGHT) {
    let presyncBlockHeight = presyncStart;
    const presyncMark = await gameStateMachine.getPresyncBlockHeight();
    if (presyncMark > 0) {
      presyncBlockHeight = presyncMark + 1;
    }

    while (run && presyncBlockHeight <= ENV.START_BLOCKHEIGHT) {
      const upper = Math.min(
        presyncBlockHeight + ENV.DEFAULT_PRESYNC_STEP_SIZE - 1,
        ENV.START_BLOCKHEIGHT
      );
      if (upper > presyncBlockHeight) {
        doLog(`p${presyncBlockHeight}-${upper}`);
      } else {
        doLog(`p${presyncBlockHeight}`);
      }
      const latestPresyncDataList = await chainFunnel.readPresyncData(presyncBlockHeight, upper);
      if (!latestPresyncDataList || latestPresyncDataList.length === 0) {
        await delay(pollingPeriod);
        continue;
      }
      const filteredPresyncDataList = latestPresyncDataList.filter(
        unit => unit.extensionDatums.length > 0
      );
      for (const presyncData of filteredPresyncDataList) {
        await gameStateMachine.presyncProcess(presyncData);
      }
      presyncBlockHeight = upper + 1;
    }
    doLog(`[paima-runtime] Presync finished at ${presyncBlockHeight}`);
  } else {
    doLog(`[paima-runtime] Skipping presync due to syncMark ${syncMark}`);
  }

  // Main sync:
  if (run) {
    doLog(
      '-------------------------------------\nBeginning Syncing & Processing Blocks\n-------------------------------------'
    );
  }
  while (run) {
    // Initializing the latest read block height and snapshotting
    let latestReadBlockHeight: number;
    try {
      latestReadBlockHeight = await acquireLatestBlockHeight(gameStateMachine, pollingPeriod);
      await snapshotIfTime(latestReadBlockHeight);
      await loopIfStopBlockReached(latestReadBlockHeight, stopBlockHeight);
      exitIfStopped(run);
    } catch (err) {
      doLog('[paima-runtime] Error in pre-funnel phase:');
      logError(err);
      continue;
    }

    // Fetching new chain data via the funnel
    let latestChainDataList: ChainData[];
    try {
      latestChainDataList = await chainFunnel.readData(latestReadBlockHeight + 1);
      exitIfStopped(run);

      // If no new chain data, delay for the duration of the pollingPeriod
      if (!latestChainDataList || !latestChainDataList?.length) {
        await delay(pollingPeriod);
        continue;
      }
    } catch (err) {
      doLog('[paima-runtime] Error received from the funnel:');
      logError(err);
      continue;
    }

    // Iterate through all of the returned chainData and process each one via the state machine's STF
    try {
      for (const chainData of latestChainDataList) {
        // Checking if should safely close in between processing blocks
        exitIfStopped(run);
        try {
          const latestReadBlockHeight = await acquireLatestBlockHeight(
            gameStateMachine,
            pollingPeriod
          );
          if (chainData.blockNumber !== latestReadBlockHeight + 1) {
            doLog(
              `[paima-runtime] Block number ${chainData.blockNumber} encountered out of order!`
            );
            break;
          }
        } catch (err) {
          doLog(
            `[paima-runtime] Error occurred prior to running STF for block ${chainData.blockNumber}:`
          );
          logError(err);
          break;
        }

        try {
          if (DataMigrations.hasPendingMigration(chainData.blockNumber)) {
            await DataMigrations.applyDataDBMigrations(chainData.blockNumber);
          }
          await gameStateMachine.process(chainData);
          exitIfStopped(run);
        } catch (err) {
          doLog(
            `[paima-runtime] Error occurred while running STF for block ${chainData.blockNumber}:`
          );
          logError(err);
          break;
        }

        try {
          const latestReadBlockHeight = await gameStateMachine.latestProcessedBlockHeight();
          await snapshotIfTime(latestReadBlockHeight);
          exitIfStopped(run);
          await loopIfStopBlockReached(latestReadBlockHeight, stopBlockHeight);
        } catch (err) {
          doLog(
            `[paima-runtime] Error occurred after running STF for block ${chainData.blockNumber}:`
          );
          logError(err);
          break;
        }
      }
    } catch (err) {
      doLog('[paima-runtime] Uncaught error propagated to runtime while processing chain data:');
      logError(err);
      continue;
    }
  }
  process.exit(0);
}
