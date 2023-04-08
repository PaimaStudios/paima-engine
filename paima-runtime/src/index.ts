import { doLog, logError, ENV } from '@paima/utils';
import type { ChainFunnel } from '@paima/utils';
import { DataMigrations } from '@paima/db';
import type { GameStateMachine, PaimaRuntimeInitializer } from '@paima/db';
import { validatePersistentCdeConfig } from '@paima/utils-backend';
import process from 'process';

import { run, setRunFlag, clearRunFlag } from './run-flag';
import { server, startServer } from './server.js';
import { initSnapshots } from './snapshots.js';
import { acquireLatestBlockHeight } from './utils';
import { startRuntime } from './runtime-loops';

process.on('SIGINT', () => {
  if (!run) process.exit(0);
  doLog('Caught SIGINT. Waiting for engine to finish processing current block before closing');
  clearRunFlag();
});

process.on('SIGTERM', () => {
  if (!run) process.exit(0);
  doLog('Caught SIGTERM. Waiting for engine to finish processing current block before closing');
  clearRunFlag();
});

process.on('exit', code => {
  // doLog(`Exiting with code: ${code}`);
});

const paimaEngine: PaimaRuntimeInitializer = {
  initialize(chainFunnel, gameStateMachine, gameBackendVersion) {
    return {
      pollingRate: 4,
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
        if (!(await runInitializationProcedures(gameStateMachine, chainFunnel, this.pollingRate))) {
          doLog(`[paima-runtime] Aborting due to initialization issues.`);
          return;
        }

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

async function runInitializationProcedures(
  gameStateMachine: GameStateMachine,
  chainFunnel: ChainFunnel,
  pollingRate: number
): Promise<boolean> {
  const pollingPeriod = pollingRate * 1000;

  // Initialize snaphots directory:
  await initSnapshots();

  // DB initialization:
  const initResult = await gameStateMachine.initializeDatabase(
    ENV.FORCE_INVALID_PAIMA_DB_TABLE_DELETION
  );
  if (!initResult) {
    doLog('[paima-runtime] Unable to initialize DB! Shutting down...');
    return false;
  }

  // CDE config initialization:
  const smStarted =
    (await gameStateMachine.presyncStarted()) || (await gameStateMachine.syncStarted());
  const cdeResult = await validatePersistentCdeConfig(
    chainFunnel.getExtensions(),
    gameStateMachine.getReadWriteDbConn(),
    smStarted
  );
  if (!cdeResult) {
    doLog('[paima-runtime] Invalid CDE configuration! Shutting down...');
    return false;
  }

  // Load data migrations
  const lastBlockHeightAtLaunch = await acquireLatestBlockHeight(gameStateMachine, pollingPeriod);

  if ((await DataMigrations.loadDataMigrations(lastBlockHeightAtLaunch)) > 0) {
    DataMigrations.setDBConnection(gameStateMachine.getReadWriteDbConn());
  }

  return true;
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
  setRunFlag();
  while (run) {
    try {
      await startRuntime(
        gameStateMachine,
        chainFunnel,
        pollingRate,
        ENV.DEFAULT_PRESYNC_STEP_SIZE,
        ENV.START_BLOCKHEIGHT,
        stopBlockHeight
      );
    } catch (err) {
      doLog('[paima-runtime] An error has been propagated all the way up to the runtime.');
      logError(err);
      doLog(`[paima-runtime] Attempt #${i} to restart and continue forward.`);
      i++;
    }
  }
}

export default paimaEngine;
