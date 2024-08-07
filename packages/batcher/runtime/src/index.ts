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
  getWalletAvailAndAddress,
} from '@paima/batcher-utils'; // load first to load ENV variables
import type { Pool } from 'pg';

import {
  AvailBatchedTransactionPoster,
  EvmBatchedTransactionPoster,
} from '@paima/batcher-transaction-poster';
import type { BatchedTransactionPoster } from '@paima/batcher-transaction-poster';
import { server, startServer } from '@paima/batcher-webserver';
import GameInputValidator, {
  DefaultInputValidatorCoreInitializator,
  EmptyInputValidatorCoreInitializator,
  getErrors,
} from '@paima/batcher-game-input-validator';

import type { AvailJsProvider, EthersEvmProvider } from '@paima/providers';
import type { ErrorCode, ErrorMessageFxn, GameInputValidatorCore } from '@paima/batcher-utils';

import { initializePool } from './pg/pgPool.js';
import type { BatcherRuntimeInitializer } from './types.js';
import { setLogger } from '@paima/utils';
import * as fs from 'fs';
import { parseSecurityYaml } from '@paima/utils-backend';
import { getRemoteBackendVersion, initMiddlewareCore } from '@paima/mw-core';
import { PaimaEventBroker } from '@paima/broker';

setLogger(s => {
  try {
    fs.appendFileSync('./logs.log', `${s}\n`);
  } catch (e) {}
});

const MINIMUM_INTER_CATCH_PERIOD = 1000;
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
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
    batchedTransactionPosterReference.updateProvider(walletWeb3);
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
        provider: EthersEvmProvider | AvailJsProvider,
        getCurrentBlock: () => Promise<number>
      ): Promise<void> {
        if (ENV.MQTT_BROKER) {
          new PaimaEventBroker('Batcher').getServer();
        }
        // pass endpoints to web server and run
        // do not await on these as they may run forever
        void Promise.all([
          startServer(pool, errorCodeToMessage, provider, getCurrentBlock).catch(e => {
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

  console.log(`Running paima-batcher version ${VERSION_STRING}`);
  console.log('Currently supporting signatures from the following chains:');
  for (const chain of SUPPORTED_CHAIN_NAMES) {
    console.log(` - ${chain}`);
  }

  const pool = initializePool();
  const backendVersion = await getRemoteBackendVersion();
  if (backendVersion.success == false) throw new Error(backendVersion.errorMessage);
  await initMiddlewareCore(
    'Game Batcher', // TODO: it doesn't matter now, but there is no way for the batcher to get the name of the game
    backendVersion.result
  );
  let provider: EthersEvmProvider | AvailJsProvider;
  let batchedTransactionPoster;
  let getCurrentBlock;

  if (!ENV.BATCHER_NETWORK || ENV.BATCHER_NETWORK === 'evm') {
    const privateKey = ENV.BATCHER_PRIVATE_KEY;
    const prov = await getWalletWeb3AndAddress(ENV.CHAIN_URI, privateKey);

    console.log('Chain URI:              ', ENV.CHAIN_URI);
    console.log('Validation type:        ', ENV.GAME_INPUT_VALIDATION_TYPE);
    console.log('PaimaL2Contract address:', ENV.CONTRACT_ADDRESS);
    console.log('Batcher account address:', prov.getAddress());

    batchedTransactionPoster = new EvmBatchedTransactionPoster(
      prov,
      ENV.CONTRACT_ADDRESS,
      ENV.BATCHED_MESSAGE_SIZE_LIMIT,
      pool
    );

    getCurrentBlock = async (): Promise<number> => {
      return await prov.getConnection().api.provider!.getBlockNumber();
    };

    provider = prov;
  } else if (ENV.BATCHER_NETWORK === 'avail') {
    if (!ENV.BATCHER_AVAIL_LIGHT_CLIENT) {
      throw new Error('Missing BATCHER_AVAIL_LIGHT_CLIENT configuration variable.');
    }

    batchedTransactionPoster = new AvailBatchedTransactionPoster(
      ENV.BATCHER_AVAIL_LIGHT_CLIENT,
      ENV.BATCHED_MESSAGE_SIZE_LIMIT,
      pool
    );

    console.log('Avail Light Client:              ', ENV.BATCHER_AVAIL_LIGHT_CLIENT);
    console.log('Avail RPC:              ', ENV.CHAIN_URI);
    console.log('Validation type:        ', ENV.GAME_INPUT_VALIDATION_TYPE);
    console.log('PaimaL2Contract address:', ENV.CONTRACT_ADDRESS);

    if (!ENV.CHAIN_URI || !ENV.BATCHER_PRIVATE_KEY) {
      throw new Error('Missing Avail configuration variables');
    }

    provider = await getWalletAvailAndAddress(ENV.CHAIN_URI, ENV.BATCHER_PRIVATE_KEY);

    // TODO: copy-pasted from funnel utils
    getCurrentBlock = async (): Promise<number> => {
      const responseRaw = await fetch(`${ENV.BATCHER_AVAIL_LIGHT_CLIENT}/v2/status`);

      if (responseRaw.status !== 200) {
        throw new Error("Couldn't get light client status");
      }

      const response: { blocks: { available: { first: number; last: number } } } =
        await responseRaw.json();

      const last = response.blocks.available.last;

      return last;
    };
  } else {
    throw new Error(`Unrecognized network: ${ENV.BATCHER_NETWORK}. Allowed values are: evm, avail`);
  }

  if (ENV.RECAPTCHA_V3_BACKEND) {
    console.log('reCAPTCHA V3 enabled');
  }

  const gameInputValidatorCore = await getValidatorCore(ENV.GAME_INPUT_VALIDATION_TYPE);
  const gameInputValidator = new GameInputValidator(gameInputValidatorCore, pool);
  batchedTransactionPosterReference = batchedTransactionPoster;
  await batchedTransactionPoster.initialize();

  const runtime = BatcherRuntime.initialize(pool);

  requestStart();
  await runtime.run(gameInputValidator, batchedTransactionPoster, provider, getCurrentBlock);
}

main().catch(e => {
  // we catch the error here instead of relying on `uncaughtException` monitoring
  // because if an exception causes us to reach this line, it means the error was thrown during initialization
  // which is typically something we cannot recover from
  console.error(e);
  process.exit(1);
});
