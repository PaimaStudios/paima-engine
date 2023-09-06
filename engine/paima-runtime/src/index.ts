import process from 'process';

import { doLog, logError, ENV } from '@paima/utils';
import { DataMigrations, deploymentChainBlockheightToEmulated, getGameInput } from '@paima/db';
import { validatePersistentCdeConfig } from './cde-config/validation';
import type { GameStateMachine, IFunnelFactory, PaimaRuntimeInitializer } from './types';

import { run, setRunFlag, clearRunFlag } from './run-flag';
import { server, startServer } from './server.js';
import { initSnapshots } from './snapshots.js';
import { startRuntime } from './runtime-loops';

export * from './cde-config/loading';
export * from './cde-config/validation';
export * from './cde-config/utils';
export * from './types';
export { TimeoutError } from './utils';

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
  initialize(funnelFactory, gameStateMachine, gameBackendVersion) {
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
        if (ENV.ENABLE_DRY_RUN) {
          this.addGET('/dry_run', (req, res): void => {
            const gameInput = String(req.query.gameInput);
            const userAddress = String(req.query.userAddress);
            doLog(`[Input Validation] ${gameInput} ${userAddress}`);
            gameStateMachine
              .dryRun(gameInput, userAddress)
              .then(valid => res.status(200).json({ valid }))
              .catch(() => res.status(500));
          });
        }
        this.addGET('/backend_version', (req, res): void => {
          res.status(200).json(gameBackendVersion);
        });
        this.addGET('/latest_processed_blockheight', (req, res): void => {
          gameStateMachine
            .latestProcessedBlockHeight()
            .then(blockHeight => res.json({ block_height: blockHeight }))
            .catch(_error => res.status(500));
        });
        this.addGET('/emulated_blocks_active', (req, res): void => {
          res.json({ emulatedBlocksActive: ENV.EMULATED_BLOCKS });
        });
        this.addGET('/deployment_blockheight_to_emulated', (req, res): void => {
          try {
            const paramString = String(req.query.deploymentBlockheight);
            const deploymentBlockheight = parseInt(paramString, 10);
            if (isNaN(deploymentBlockheight)) {
              res.status(400).json({
                success: false,
                errorMessage: 'Invalid or missing deploymentBlockheight parameter',
              });
            }

            const DBConn = gameStateMachine.getReadonlyDbConn();
            deploymentChainBlockheightToEmulated
              .run({ deployment_chain_block_height: deploymentBlockheight }, DBConn)
              .then(emulatedBlockheights => {
                if (emulatedBlockheights.length !== 1) {
                  return res.status(200).json({
                    success: false,
                    errorMessage: `Supplied blockheight ${deploymentBlockheight} not found in DB`,
                  });
                } else {
                  return res.status(200).json({
                    success: true,
                    result: emulatedBlockheights[0].emulated_block_height,
                  });
                }
              })
              .catch(err => {
                doLog(`Webserver error:`);
                logError(err);
                return res.status(500).json({
                  success: false,
                  errorMessage: 'Unable to fetch blockheights from DB',
                });
              });
          } catch (err) {
            doLog(`Unexpected webserver error:`);
            logError(err);
            res.status(500).json({
              success: false,
              errorMessage: 'Unknown error, please contact game node administrator',
            });
          }
        });
        this.addGET('/confirm_input_acceptance', (req, res): void => {
          try {
            if (!ENV.STORE_HISTORICAL_GAME_INPUTS) {
              res.status(500).json({
                success: false,
                errorMessage: 'Game input storing turned off in the game node',
              });
              return;
            }

            const gameInput = String(req.query.gameInput);
            const userAddress = String(req.query.userAddress);
            const blockHeightString = String(req.query.blockHeight);
            const blockHeight = parseInt(blockHeightString, 10);

            if (!userAddress) {
              res.status(400).json({
                success: false,
                errorMessage: 'Query missing userAddress',
              });
              return;
            }
            if (!blockHeight) {
              res.status(400).json({
                success: false,
                errorMessage: 'Query missing blockHeight',
              });
              return;
            }
            if (!gameInput) {
              res.status(400).json({
                success: false,
                errorMessage: 'Query missing gameInput',
              });
              return;
            }

            const DBConn = gameStateMachine.getReadonlyDbConn();
            getGameInput
              .run(
                {
                  user_address: userAddress,
                  block_height: blockHeight,
                },
                DBConn
              )
              .then(results => {
                for (const row of results) {
                  if (row.input_data === gameInput) {
                    return res.status(200).json({
                      success: true,
                      result: true,
                    });
                  }
                }
                return res.status(200).json({
                  success: true,
                  result: false,
                });
              })
              .catch(err => {
                doLog(`Webserver error:`);
                logError(err);
                return res.status(500).json({
                  success: false,
                  errorMessage: 'Unable to fetch game inputs from the DB',
                });
              });
          } catch (err) {
            doLog(`Unexpected webserver error:`);
            logError(err);
            res.status(500).json({
              success: false,
              errorMessage: 'Unknown error, please contact game node administrator',
            });
          }
        });

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
