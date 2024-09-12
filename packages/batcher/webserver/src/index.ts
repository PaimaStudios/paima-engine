import cors from 'cors';
import express from 'express';
import type { Request, Response } from 'express';
import type { Pool } from 'pg';

import AddressValidator from '@paima/batcher-address-validator';
import type { IGetInputStateResult } from '@paima/batcher-db';
import {
  getInputState,
  insertStateValidating,
  insertStateAccepted,
  insertUnvalidatedInput,
  insertValidatedInput,
} from '@paima/batcher-db';
import { ENV, keepRunning, setWebserverClosed, unsetWebserverClosed } from '@paima/batcher-utils';
import type { ErrorMessageFxn } from '@paima/batcher-utils';
import type { AvailJsProvider, EthersEvmProvider } from '@paima/providers';
import type { BatchedSubunit } from '@paima/concise';
import { createMessageForBatcher } from '@paima/concise';
import { AddressType, getWriteNamespace, wait } from '@paima/utils';
import { hashBatchSubunit } from '@paima/concise';
import { RecaptchaError, reCaptchaValidation } from './recaptcha.js';
import { BatcherPayment, BatcherPaymentError } from './payment.js';

const port = ENV.BATCHER_PORT;

let pool: Pool;

const server = express();
const bodyParser = express.json();
server.use(cors());
server.use(bodyParser);

let blockHeightCache = {
  height: 0,
  time: 0,
};

type TrackUserInputRequest = {
  input_hash: string;
};
type TrackUserInputRejected = {
  status: 'rejected';
  message: string;
};
type TrackUserInputPosted = {
  status: 'posted';
} & Pick<IGetInputStateResult, 'block_height' | 'transaction_hash'>;
type TrackUserInputAccepted = {
  status: 'accepted';
};
type TrackUserInputValidating = {
  status: 'validating';
};
type TrackUserInputResult =
  | ({
      success: true;
      hash: string;
    } & (
      | TrackUserInputRejected
      | TrackUserInputPosted
      | TrackUserInputAccepted
      | TrackUserInputValidating
    ))
  | {
      success: false;
      message: string;
      hash?: string;
    };

type SubmitSelfSignedInputRequest = {
  game_input: string;
  timestamp: string;
  api_key: string;
};
type SubmitSelfSignedInputResponse =
  | {
      success: false;
      message: string;
    }
  | {
      success: true;
      hash: string;
    };

type SubmitUserInputRequest = {
  address_type: AddressType;
  user_address: string;
  game_input: string;
  timestamp: string;
  user_signature: string;
  captcha: string;
};
type SubmitUserInputResponse =
  | {
      success: false;
      message: string;
      code?: number;
    }
  | {
      success: true;
      hash: string;
    };

/*
eslint-disable @typescript-eslint/no-misused-promises --
Express types don't allow server.get calls with a promise callback
despite the fact these work perfectly as-is
TODO: This will be fixed in express v5 when it comes out
*/
async function initializeServer(
  pool: Pool,
  errorCodeToMessage: ErrorMessageFxn,
  provider: EthersEvmProvider | AvailJsProvider,
  getCurrentBlock: () => Promise<number>
): Promise<void> {
  const addressValidator = new AddressValidator(pool);

  server.get(
    '/track_user_input',
    async (
      req: Request<unknown, unknown, unknown, TrackUserInputRequest>,
      res: Response<TrackUserInputResult>
    ) => {
      try {
        if (!req.query.hasOwnProperty('input_hash')) {
          res.status(400).json({
            success: false,
            message: 'Invalid request options',
          });
          return;
        }
        const hash = req.query.input_hash || '';

        if (!keepRunning) {
          res.status(500).json({
            success: false,
            message: 'Batcher shutting down',
          });
          return;
        }

        const results = await getInputState.run({ input_hash: hash }, pool);

        if (results.length === 0) {
          res.status(200).json({
            success: false,
            message: 'Hash not found',
            hash,
          });
          return;
        }
        if (results.length > 1) {
          console.log('[webserver] WARNING: multiple results for hash', hash);
        }

        const result = results[0];
        const status = result.current_state;
        let returnValueCore = {
          success: true as const,
          hash,
        };
        let returnValue: TrackUserInputResult;
        if (status === 'rejected') {
          returnValue = {
            ...returnValueCore,
            status,
            message: errorCodeToMessage(result.rejection_code || 0),
          };
        } else if (status === 'posted') {
          returnValue = {
            ...returnValueCore,
            status,
            block_height: result.block_height,
            transaction_hash: result.transaction_hash,
          };
        } else {
          returnValue = {
            ...returnValueCore,
            status,
          };
        }
        res.status(200).json(returnValue);
      } catch (err) {
        console.log('[webserver/track_user_input] error:', err);
        res.status(500).json({
          success: false,
          message: 'Unknown server error, please batcher operator',
        });
      }
    }
  );

  server.post(
    '/submit_self_signed_input',
    async (
      req: Request<unknown, unknown, SubmitSelfSignedInputRequest>,
      res: Response<SubmitSelfSignedInputResponse>
    ) => {
      try {
        if (!ENV.SELF_SIGNING_ENABLED) {
          res.status(403).json({
            success: false,
            message: 'Endpoint disabled',
          });
          return;
        }

        const expectedProps = ['game_input', 'timestamp', 'api_key'];
        const requestValid = expectedProps.every(prop => req.body.hasOwnProperty(prop));
        if (!requestValid) {
          res.status(400).json({
            success: false,
            message: 'Invalid request options',
          });
          return;
        }
        const [gameInput, millisecondTimestamp, apiKey] = [
          req.body.game_input || '',
          req.body.timestamp || '',
          req.body.api_key || '',
        ];

        if (apiKey !== ENV.SELF_SIGNING_API_KEY) {
          res.status(403).json({
            success: false,
            message: 'Invalid API key',
          });
          return;
        }

        const addressType = provider.getAddress().type;

        const message: string = createMessageForBatcher(
          await getWriteNamespace(),
          gameInput,
          millisecondTimestamp
        );
        const userSignature = await provider.signMessage(message);

        const input: BatchedSubunit = {
          addressType,
          userAddress: provider.getAddress().address,
          gameInput,
          millisecondTimestamp,
          userSignature,
        };
        const hash = hashBatchSubunit(input);

        if (!keepRunning) {
          res.status(500).json({
            success: false,
            message: 'Batcher shutting down',
          });
          return;
        }

        const states = await getInputState.run({ input_hash: hash }, pool);
        if (states.length >= 1) {
          console.log('[webserver] Rejecting duplicate input!');
          res.status(400).json({
            success: false,
            message: 'Input has already been submitted',
          });
          return;
        }

        if (!keepRunning) {
          res.status(500).json({
            success: false,
            message: 'Batcher shutting down',
          });
          return;
        }

        try {
          unsetWebserverClosed();
          await insertStateAccepted.run({ input_hash: hash }, pool);
          await insertValidatedInput.run(
            {
              address_type: addressType,
              user_address: provider.getAddress().address,
              game_input: gameInput,
              millisecond_timestamp: millisecondTimestamp,
              user_signature: userSignature,
            },
            pool
          );
          setWebserverClosed();
        } catch (err) {
          console.log('[webserver] Error while setting input as validated.');
          res.status(500).json({
            success: false,
            message: 'Internal server error',
          });
          return;
        }
        console.log('[webserver] Input has been accepted!');
        res.status(200).json({
          success: true,
          hash: hash,
        });
        return;
      } catch (err) {
        console.log('[webserver/submit_self_signed_input] error:', err);
        res.status(500).json({
          success: false,
          message: 'Unknown server error, please contact batcher operator',
        });
      }
    }
  );

  server.post(
    '/submit_user_input',
    async (
      req: Request<unknown, unknown, SubmitUserInputRequest>,
      res: Response<SubmitUserInputResponse>
    ) => {
      try {
        const expectedProps = [
          'address_type',
          'user_address',
          'game_input',
          'timestamp',
          'user_signature',
        ];
        const requestValid = expectedProps.every(prop => req.body.hasOwnProperty(prop));
        if (!requestValid) {
          res.status(400).json({
            success: false,
            message: 'Invalid request options',
          });
          return;
        }

        const [addressType, userAddress, gameInput, millisecondTimestamp, userSignature, captcha] =
          [
            req.body.address_type || AddressType.UNKNOWN,
            req.body.user_address || '',
            req.body.game_input || '',
            req.body.timestamp || '',
            req.body.user_signature || '',
            req.body.captcha || '',
          ];
        const input: BatchedSubunit = {
          addressType,
          userAddress,
          gameInput,
          millisecondTimestamp,
          userSignature,
        };
        const hash = hashBatchSubunit(input);

        if (!keepRunning) {
          res.status(500).json({
            success: false,
            message: 'Batcher shutting down',
          });
          return;
        }

        const states = await getInputState.run({ input_hash: hash }, pool);
        if (states.length >= 1) {
          console.log('[webserver] Rejecting duplicate input!');
          res.status(400).json({
            success: false,
            message: 'Input has already been submitted',
          });
          return;
        }

        if (!keepRunning) {
          res.status(500).json({
            success: false,
            message: 'Batcher shutting down',
          });
          return;
        }

        let blockHeight = null;
        while (blockHeight == null) {
          const now = new Date().getTime();
          if (now - blockHeightCache.time < 60 * 1000) {
            blockHeight = blockHeightCache.height;
          } else {
            console.log('BlockNumber cache miss');
            try {
              blockHeight = await getCurrentBlock();
              blockHeightCache.height = blockHeight;
              blockHeightCache.time = new Date().getTime();
            } catch (e) {
              console.error('getBlockNumber failed. Will retry');
              console.error(e);
              await wait(1000);
            }
          }
        }
        const validity = await addressValidator.validateUserInput(input, blockHeight);

        if (!keepRunning) {
          res.status(500).json({
            success: false,
            message: 'Batcher shutting down',
          });
          return;
        }

        if (validity !== 0) {
          res.status(400).json({
            success: false,
            message: errorCodeToMessage(validity),
            code: validity,
          });
          return;
        }
        const payload = {
          address_type: addressType,
          user_address: userAddress,
          game_input: gameInput,
          millisecond_timestamp: millisecondTimestamp,
          user_signature: userSignature,
        };

        let weiUsed = BigInt(0);
        if (ENV.BATCHER_PAYMENT_ENABLED) {
          try {
            weiUsed = await BatcherPayment.estimateGasFee(JSON.stringify(payload));
            await BatcherPayment.hasEnoughBalance(userAddress, weiUsed);
            BatcherPayment.addTemporalGasFee(userAddress, weiUsed);
          } catch (err) {
            console.log('[webserver] Not enough funds.');
            res.status(400).json({
              success: false,
              message: 'Insufficient funds',
            });
            return;
          }
        }

        try {
          await reCaptchaValidation(captcha);
          unsetWebserverClosed();
          await insertStateValidating.run({ input_hash: hash }, pool);
          await insertUnvalidatedInput.run(payload, pool);
          setWebserverClosed();
        } catch (err) {
          if (err instanceof RecaptchaError) {
            console.log('[webserver] Recaptcha validation failed.');
            console.log({ addressType, userAddress, gameInput, millisecondTimestamp });
          } else {
            console.log('[webserver] Error while setting input as validated.');
          }
          if (ENV.BATCHER_PAYMENT_ENABLED) {
            BatcherPayment.revertTemporalGasFee(userAddress, weiUsed);
          }
          res.status(500).json({
            success: false,
            message: 'Internal server error',
          });
          return;
        }
        console.log('[webserver] Input has been accepted!');
        res.status(200).json({
          success: true,
          hash: hash,
        });
        return;
      } catch (err) {
        console.log('[webserver/submit_user_input] error:', err);
        res.status(500).json({
          success: false,
          message: 'Unknown server error, please contact batcher operator',
        });
      }
    }
  );
}

async function startServer(
  _pool: Pool,
  errorCodeToMessage: ErrorMessageFxn,
  provider: EthersEvmProvider | AvailJsProvider,
  getCurrentBlock: () => Promise<number>
): Promise<void> {
  pool = _pool;
  await initializeServer(pool, errorCodeToMessage, provider, getCurrentBlock);
  setWebserverClosed();
  server.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
  });
}

export { server, startServer };
