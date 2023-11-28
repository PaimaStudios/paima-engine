import process from 'process';

import { doLog, logError, ENV } from '@paima/utils';
import { DataMigrations } from '@paima/db';
import { validatePersistentCdeConfig } from './cde-config/validation.js';
import type { IFunnelFactory, PaimaRuntimeInitializer } from './types.js';
import type { GameStateMachine } from '@paima/sm';

import { run, setRunFlag, clearRunFlag } from './run-flag.js';
import { server, startServer } from './server.js';
import { initSnapshots } from './snapshots.js';
import { startRuntime } from './runtime-loops.js';

export * from './cde-config/loading.js';
export * from './cde-config/validation.js';
export * from './cde-config/utils.js';
export * from './types.js';
export { registerDocs, registerValidationErrorHandler } from './server.js';
export { TimeoutError } from './utils.js';

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
  initialize(funnelFactory, gameStateMachine, _gameBackendVersion) {
    return {
      pollingRate: ENV.POLLING_RATE,
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
        setRunFlag();

        // run all initializations needed before starting the runtime loop
        if (!(await runInitializationProcedures(gameStateMachine, funnelFactory))) {
          doLog(`[paima-runtime] Aborting starting game node due to initialization issues.`);
          return;
        }

        // pass endpoints to web server and run
        startServer();

        if (serverOnlyMode) {
          doLog(`Running in webserver-only mode. No new blocks/game inputs will be synced.`);
        } else {
          await startSafeRuntime(
            gameStateMachine,
            funnelFactory,
            this.pollingRate,
            stopBlockHeight
          );
        }
      },
    };
  },
};

async function runInitializationProcedures(
  gameStateMachine: GameStateMachine,
  funnelFactory: IFunnelFactory
): Promise<boolean> {
  // Initialize snapshots directory:
  await initSnapshots();

  // DB initialization:
  const initResult = await gameStateMachine.initializeDatabase(
    ENV.FORCE_INVALID_PAIMA_DB_TABLE_DELETION
  );
  if (!initResult) {
    doLog('[paima-runtime] Unable to initialize DB! Shutting down...');
    return false;
  }

  // CDE config validation / storing:
  if (!funnelFactory.extensionsAreValid()) {
    doLog(
      `[paima-runtime] Cannot proceed because the CDE config file invalid. Please fix your CDE config file or remove it altogether.`
    );
    return false;
  }
  const smStarted =
    (await gameStateMachine.presyncStarted()) || (await gameStateMachine.syncStarted());
  const cdeResult = await validatePersistentCdeConfig(
    funnelFactory.getExtensions(),
    gameStateMachine.getReadWriteDbConn(),
    smStarted
  );
  if (!cdeResult) {
    doLog(
      `[paima-runtime] New/changed extensions detected in 'extensions.yml'. Please resync your game node from scratch after adding/removing/changing extensions.`
    );
    return false;
  }

  // Load data migrations
  const lastBlockHeightAtLaunch = await gameStateMachine.latestProcessedBlockHeight();
  await DataMigrations.loadDataMigrations(lastBlockHeightAtLaunch);

  return true;
}

// A wrapper around the actual runtime which ensures the game node (aka. backend) will never go down due to uncaught exceptions.
// Of note, current implementation will continue to restart the runtime no matter what the issue is at hand.
async function startSafeRuntime(
  gameStateMachine: GameStateMachine,
  funnelFactory: IFunnelFactory,
  pollingRate: number,
  stopBlockHeight: number | null
): Promise<void> {
  let i = 1;
  while (run) {
    try {
      await startRuntime(
        gameStateMachine,
        funnelFactory,
        pollingRate,
        ENV.DEFAULT_PRESYNC_STEP_SIZE,
        ENV.START_BLOCKHEIGHT,
        stopBlockHeight,
        ENV.EMULATED_BLOCKS
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
