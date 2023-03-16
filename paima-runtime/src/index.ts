import type { ChainData, ChainFunnel } from '@paima/utils';
import { doLog, logError } from '@paima/utils';
import type { GameStateMachine, PaimaRuntimeInitializer } from '@paima/db';
import process from 'process';
import { server, startServer } from './server.js';
import { initSnapshots, snapshotIfTime } from './snapshots.js';
let run = false;

process.on('SIGINT', () => {
  if (!run) process.exit(0);
  doLog('Caught SIGINT. Waiting for engine to finish processing current block');
  run = false;
});

process.on('SIGTERM', () => {
  if (!run) process.exit(0);
  doLog('Caught SIGTERM. Waiting for engine to finish processing current block');
  run = false;
});

process.on('exit', code => {
  // doLog(`Exiting with code: ${code}`);
});

const paimaEngine: PaimaRuntimeInitializer = {
  initialize(chainFunnel, gameStateMachine, gameBackendVersion) {
    // initialize snapshot folder
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

        await initSnapshots();

        // pass endpoints to web server and run
        startServer();

        if (serverOnlyMode) {
          doLog(`Running in webserver-only mode. No new blocks/game inputs will be synced.`);
        } else {
          await securedIterativeRuntime(
            gameStateMachine,
            chainFunnel,
            this.pollingRate,
            stopBlockHeight
          );
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

async function securedIterativeRuntime(
  gameStateMachine: GameStateMachine,
  chainFunnel: ChainFunnel,
  pollingRate: number,
  stopBlockHeight: number | null
): Promise<void> {
  let i = 1;
  run = true;
  while (run) {
    try {
      await startIterativeRuntime(gameStateMachine, chainFunnel, pollingRate, stopBlockHeight);
    } catch (err) {
      doLog('[paima-runtime] An error has been propagated all the way up to the runtime.');
      logError(err);
      doLog(`[paima-runtime] Attempt #${i} to re-process and continue running.`);
      i++;
    }
  }
}

async function acquireLatestBlockHeight(sm: GameStateMachine, waitPeriod: number): Promise<number> {
  let wasDown = false;
  while (run) {
    try {
      const latestReadBlockHeight = await sm.latestBlockHeight();
      if (wasDown) {
        doLog('[paima-runtime] Block height re-acquired successfully.');
      }
      return latestReadBlockHeight;
    } catch (err) {
      if (!wasDown) {
        doLog(`[paima-runtime] Encountered error in reading latest block height, retrying after ${waitPeriod} ms`);
        logError(err);
      }
      wasDown = true;
    }
    await delay(waitPeriod);
  }
  exitIfStopped(run);
  return -1;
}

async function startIterativeRuntime(
  gameStateMachine: GameStateMachine,
  chainFunnel: ChainFunnel,
  pollingRate: number,
  stopBlockHeight: number | null
): Promise<void> {
  const pollingPeriod = pollingRate * 1000;
  while (run) {
    let latestReadBlockHeight: number;

    try {
      latestReadBlockHeight = await acquireLatestBlockHeight(gameStateMachine, pollingPeriod);
      await snapshotIfTime(latestReadBlockHeight);
      await loopIfStopBlockReached(latestReadBlockHeight, stopBlockHeight);
      exitIfStopped(run);
    } catch (err) {
      doLog('[startIterativeRuntime] error in pre-read phase:');
      logError(err);
      continue;
    }

    /
    // Fetch new chain data via the funnel
    let latestChainDataList: ChainData[];
    try {
      // Read latest chain data from funnel
      latestChainDataList = await chainFunnel.readData(latestReadBlockHeight + 1);
      // Checking if should safely close after fetching all chain data
      // which may take some time
      exitIfStopped(run);

      if (!latestChainDataList || !latestChainDataList?.length) {
        await delay(pollingPeriod);
        continue;
      }
    } catch (err) {
      doLog('[startIterativeRuntime] error in read phase:');
      logError(err);
      continue;
    }

    // Iterate through all of the returned chainData
    try {
      for (const block of latestChainDataList) {
        // Checking if should safely close in between processing blocks
        exitIfStopped(run);
        try {
          const latestReadBlockHeight = await acquireLatestBlockHeight(
            gameStateMachine,
            pollingPeriod
          );
          if (block.blockNumber !== latestReadBlockHeight + 1) {
            break;
          }
        } catch (err) {
          doLog(`[startIterativeRuntime] error before processing block ${block.blockNumber}:`);
          logError(err);
          break;
        }

        try {
          await gameStateMachine.process(block);
          exitIfStopped(run);
        } catch (err) {
          doLog(`[startIterativeRuntime] error while processing block ${block.blockNumber}:`);
          logError(err);
          break;
        }

        try {
          const latestReadBlockHeight = await gameStateMachine.latestBlockHeight();
          await snapshotIfTime(latestReadBlockHeight);
          exitIfStopped(run);
          await loopIfStopBlockReached(latestReadBlockHeight, stopBlockHeight);
        } catch (err) {
          doLog(`[startIterativeRuntime] error after processing block ${block.blockNumber}:`);
          logError(err);
          break;
        }
      }
    } catch (err) {
      doLog('[startIterativeRuntime] error in process phase:');
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
