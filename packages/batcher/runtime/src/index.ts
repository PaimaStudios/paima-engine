import {
  ENV,
  getWalletWeb3AndAddress,
  keepRunning,
  requestStop,
  requestStart,
  GameInputValidatorCoreType,
  SUPPORTED_CHAIN_NAMES,
  VERSION_STRING,
  getAndConfirmWeb3,
  getInvalidEnvVars,
} from '@paima/batcher-utils'; // load first to load ENV variables
import type { Pool } from 'pg';

import BatchedTransactionPoster from '@paima/batcher-transaction-poster';
import { server, startServer } from '@paima/batcher-webserver';
import GameInputValidator, {
  DefaultInputValidatorCoreInitializator,
  EmptyInputValidatorCoreInitializator,
  getErrors,
} from '@paima/batcher-game-input-validator';

import type { EthersEvmProvider } from '@paima/providers';
import type { ErrorCode, ErrorMessageFxn, GameInputValidatorCore } from '@paima/batcher-utils';

import { initializePool } from './pg/pgPool.js';
import type { BatcherRuntimeInitializer } from './types.js';
import { setLogger } from '@paima/utils';
import * as fs from 'fs';
import { parseSecurityYaml } from '@paima/utils-backend';
import { getRemoteBackendVersion, initMiddlewareCore } from '@paima/mw-core';
import { MQTTBroker } from './mqtt/mqtt-broker.js';
import { MQTTPublisher, MQTTSystemEvents } from './mqtt/mqtt-publisher.js';

setLogger(s => {
  try {
    fs.appendFileSync('./logs.log', `${s}\n`);
  } catch (e) {}
});

const MINIMUM_INTER_CATCH_PERIOD = 1000;
let batchedTransactionPosterReference: BatchedTransactionPoster | null = null;
let lastCatchDate = Date.now();
let reinitializingWeb3 = false;

process.on('SIGINT', () => {
  if (!keepRunning) process.exit(0);
  console.log('Caught SIGINT. Waiting for processes to finish...');
  requestStop();
});

process.on('SIGTERM', () => {
  if (!keepRunning) process.exit(0);
  console.log('Caught SIGTERM. Waiting for processes to finish...');
  requestStop();
});

// Using a promise here is okay because we do not shutdown the process for this uncaughtException callback
// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on('uncaughtException', async err => {
  if (Date.now() - lastCatchDate < MINIMUM_INTER_CATCH_PERIOD) {
    return;
  }
  lastCatchDate = Date.now();
  console.error(err);
  if (!reinitializingWeb3 && batchedTransactionPosterReference) {
    reinitializingWeb3 = true;
    const walletWeb3 = await getAndConfirmWeb3(ENV.CHAIN_URI, ENV.BATCHER_PRIVATE_KEY, 1000);
    reinitializingWeb3 = false;
    batchedTransactionPosterReference.updateWeb3(walletWeb3);
  }
});

const ERROR_MESSAGES = getErrors(ENV.GAME_INPUT_VALIDATION_TYPE);

const errorCodeToMessage: ErrorMessageFxn = (errorCode: ErrorCode) => {
  if (!ERROR_MESSAGES.hasOwnProperty(errorCode)) {
    return 'Unknown error code: ' + errorCode;
  } else {
    return ERROR_MESSAGES[errorCode];
  }
};

async function getValidatorCore(
  validationType: GameInputValidatorCoreType
): Promise<GameInputValidatorCore> {
  switch (validationType) {
    case GameInputValidatorCoreType.DEFAULT:
      return await DefaultInputValidatorCoreInitializator.initialize();
    case GameInputValidatorCoreType.NO_VALIDATION:
    default:
      return await EmptyInputValidatorCoreInitializator.initialize();
  }
}

const BatcherRuntime: BatcherRuntimeInitializer = {
  initialize(pool: Pool) {
    return {
      addGET(route, callback): void {
        server.get(route, callback);
      },
      addPOST(route, callback): void {
        server.post(route, callback);
      },
      async run(
        gameInputValidator: GameInputValidator,
        batchedTransactionPoster: BatchedTransactionPoster,
        provider: EthersEvmProvider
      ): Promise<void> {
        // pass endpoints to web server and run

        // if (ENV.MQTT_BROKER) {
        // Load Server
        MQTTBroker.getServer();
        // TODO is this necessary?
        const wait = (n: number): Promise<void> => new Promise(resolve => setTimeout(resolve, n));
        await wait(1000);
        // }
        // Listen to all system events
        MQTTPublisher.startListener(MQTTSystemEvents.BATCHER_HASH).catch((e: any) =>
          console.log(e)
        );

        // do not await on these as they may run forever
        void Promise.all([
          startServer(pool, errorCodeToMessage, provider).catch(e => {
            console.log('Uncaught error in startServer');
            console.log(e);
            throw e;
          }),
          gameInputValidator.run(ENV.GAME_INPUT_VALIDATOR_PERIOD).catch(e => {
            console.log('Uncaught error in gameInputValidator');
            console.log(e);
            throw e;
          }),
          ,
          batchedTransactionPoster.run(ENV.BATCHED_TRANSACTION_POSTER_PERIOD).catch(e => {
            console.log('Uncaught error in batchedTransactionPoster');
            console.log(e);
            throw e;
          }),
        ]);
      },
    };
  },
};

function checkConfig(): boolean {
  const missingVars = getInvalidEnvVars();
  if (missingVars.length === 0) {
    return true;
  }

  console.log(
    'The following variables are missing in your config file or are set to invalid values:'
  );
  for (const missingVar of missingVars) {
    console.log(` - ${missingVar}`);
  }
  return false;
}

async function main(): Promise<void> {
  if (!checkConfig()) {
    process.exitCode = 1;
    return;
  }
  await parseSecurityYaml();

  const privateKey = ENV.BATCHER_PRIVATE_KEY;

  console.log(`Running paima-batcher version ${VERSION_STRING}`);
  console.log('Currently supporting signatures from the following chains:');
  for (const chain of SUPPORTED_CHAIN_NAMES) {
    console.log(` - ${chain}`);
  }

  const pool = initializePool();
  await initMiddlewareCore(
    'Game Batcher', // TODO: it doesn't matter now, but there is no way for the batcher to get the name of the game
    await getRemoteBackendVersion()
  );
  const provider = await getWalletWeb3AndAddress(ENV.CHAIN_URI, privateKey);

  console.log('Chain URI:              ', ENV.CHAIN_URI);
  console.log('Validation type:        ', ENV.GAME_INPUT_VALIDATION_TYPE);
  console.log('PaimaL2Contract address:', ENV.CONTRACT_ADDRESS);
  console.log('Batcher account address:', provider.getAddress());
  if (ENV.RECAPTCHA_V3_BACKEND) {
    console.log('reCAPTCHA V3 enabled');
  }

  const gameInputValidatorCore = await getValidatorCore(ENV.GAME_INPUT_VALIDATION_TYPE);
  const gameInputValidator = new GameInputValidator(gameInputValidatorCore, pool);
  const batchedTransactionPoster = new BatchedTransactionPoster(
    provider,
    ENV.CONTRACT_ADDRESS,
    ENV.BATCHED_MESSAGE_SIZE_LIMIT,
    pool
  );
  batchedTransactionPosterReference = batchedTransactionPoster;
  await batchedTransactionPoster.initialize();

  const runtime = BatcherRuntime.initialize(pool);

  requestStart();
  await runtime.run(gameInputValidator, batchedTransactionPoster, provider);
}

main().catch(e => {
  // we catch the error here instead of relying on `uncaughtException` monitoring
  // because if an exception causes us to reach this line, it means the error was thrown during initalization
  // which is typically something we cannot recover from
  console.error(e);
  process.exit(1);
});
