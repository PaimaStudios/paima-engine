import type { ChainData, ChainFunnel } from '@paima/utils';
import { doLog, logError, ENV } from '@paima/utils';
import type { GameStateMachine, PaimaRuntimeInitializer } from '@paima/db';
import { DataMigrations } from '@paima/db';
import process from 'process';
import { server, startServer } from './server.js';
import { initSnapshots, snapshotIfTime } from './snapshots.js';
let run = false;

process.on('SIGINT', () => {
  if (!run) process.exit(0);
  doLog('Caught SIGINT. Waiting for engine to finish processing current block before closing');
  run = false;
});

process.on('SIGTERM', () => {
  if (!run) process.exit(0);
  doLog('Caught SIGTERM. Waiting for engine to finish processing current block before closing');
  run = false;
});

process.on('exit', code => {
  // doLog(`Exiting with code: ${code}`);
});

const paimaEngine: PaimaRuntimeInitializer = {
  initialize(chainFunnel, gameStateMachine, gameBackendVersion) {
    return {
      pollingRate: 4,
      chainDataExtensions: [],
      addEndpoints(tsoaFunction): void {
        tsoaFunction(server);
      },
      addGET(route, callback): void {
        server.get(route, callback);
      },
      addPOST(route, callback): void {
        server.post(route, callback);
      },
      setPollingRate(seconds: number): void {
        this.pollingRate = seconds;
      },
      addExtensions(chainDataExtensions): void {
        this.chainDataExtensions = [...this.chainDataExtensions, ...chainDataExtensions];
      },
      async run(stopBlockHeight: number | null, serverOnlyMode = false): Promise<void> {
        this.addGET('/backend_version', (req, res): void => {
          res.status(200).json(gameBackendVersion);
        });
        this.addGET('/latest_processed_blockheight', (req, res): void => {
          gameStateMachine
            .latestProcessedBlockHeight()
            .then(blockHeight => res.json({ block_height: blockHeight }))
            .catch(_error => res.status(500));
        });

        // initialize snapshot folder
        await initSnapshots();

        // pass endpoints to web server and run
        startServer();

        if (serverOnlyMode) {
          doLog(`Running in webserver-only mode. No new blocks/game inputs will be synced.`);
        } else {
          await startSafeRuntime(gameStateMachine, chainFunnel, this.pollingRate, stopBlockHeight);
        }
      },
    };
  },
};

async function loopIfStopBlockReached(
  latestReadBlockHeight: number,
  stopBlockHeight: number | null
): Promise<void> {
  if (stopBlockHeight !== null && latestReadBlockHeight >= stopBlockHeight) {
    doLog(`Reached stop block height, stopping the funnel...`);
    while (run) {
      await delay(2000);
    }
    process.exit(0);
  }
}

function exitIfStopped(run: boolean): void {
  if (!run) {
    process.exit(0);
  }
}

// A wrapper around the actual runtime which ensures the game node (aka. backend) will never go down due to uncaught exceptions.
// Of note, current implementation will continue to restart the runtime no matter what the issue is at hand.
async function startSafeRuntime(
  gameStateMachine: GameStateMachine,
  chainFunnel: ChainFunnel,
  pollingRate: number,
  stopBlockHeight: number | null
): Promise<void> {
  let i = 1;
  run = true;
  while (run) {
    try {
      await startRuntime(gameStateMachine, chainFunnel, pollingRate, stopBlockHeight);
    } catch (err) {
      doLog('[paima-runtime] An error has been propagated all the way up to the runtime.');
      logError(err);
      doLog(`[paima-runtime] Attempt #${i} to restart and continue forward.`);
      i++;
    }
  }
}

async function acquireLatestBlockHeight(sm: GameStateMachine, waitPeriod: number): Promise<number> {
  let wasDown = false;
  while (run) {
    try {
      const latestReadBlockHeight = await sm.latestProcessedBlockHeight();
      if (wasDown) {
        doLog('[paima-runtime] Block height re-acquired successfully.');
      }
      return latestReadBlockHeight;
    } catch (err) {
      if (!wasDown) {
        doLog(
          `[paima-runtime] Encountered error in reading latest block height, retrying after ${waitPeriod} ms`
        );
        logError(err);
      }
      wasDown = true;
    }
    await delay(waitPeriod);
  }
  exitIfStopped(run);
  return -1;
}

// The core logic of paima runtime which polls the funnel and processes the resulting chain data using the game's state machine.
// Of note, the runtime is designed to continue running/attempting to process the next required block no matter what errors propagate upwards.
// This is a good approach in the case of networking problems or other edge cases which address themselves over time, and ensuring that the game node never goes offline.
// However of note, it is possible for the game node to get into a "soft-lock" state if the game state machine is badly coded and has uncaught exceptions which cause
// the runtime to continuously retry syncing the same block, and failing each time.
async function startRuntime(
  gameStateMachine: GameStateMachine,
  chainFunnel: ChainFunnel,
  pollingRate: number,
  stopBlockHeight: number | null
): Promise<void> {
  const pollingPeriod = pollingRate * 1000;
  let loopCount = 0;

  const initResult = await gameStateMachine.initializeDatabase(
    ENV.FORCE_INVALID_PAIMA_DB_TABLE_DELETION
  );
  if (!initResult) {
    doLog('[paima-runtime] Unable to initialize DB! Shutting down...');
    run = false;
  }

  // Load data migrations
  const lastBlockHeightAtLaunch = await acquireLatestBlockHeight(gameStateMachine, pollingPeriod);
  DataMigrations.loadDataMigrations(lastBlockHeightAtLaunch);

  while (run) {
    loopCount++;

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
    if (loopCount == 1)
      doLog(
        '-------------------------------------\nBeginning Syncing & Processing Blocks\n-------------------------------------'
      );
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
            await DataMigrations.applyDataDBMigrations(
              gameStateMachine.getReadonlyDbConn(),
              chainData.blockNumber
            );
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

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default paimaEngine;
