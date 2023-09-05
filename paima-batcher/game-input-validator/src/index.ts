import type { Pool } from 'pg';

import {
  setGameInputValidatorClosed,
  unsetGameInputValidatorClosed,
  wait,
} from '@paima-batcher/utils';
import type { GameInputValidatorCore } from '@paima-batcher/utils';
import {
  getUnvalidatedInputs,
  deleteUnvalidatedInput,
  validateInput,
  updateStateAccepted,
  updateStateRejected,
} from '@paima-batcher/db';
import type { IGetUnvalidatedInputsResult } from '@paima-batcher/db';
import { keepRunning } from '@paima-batcher/utils';

import { EmptyInputValidatorCoreInitializator } from './empty-validator.js';
import { getErrors } from './errors.js';
import { DefaultInputValidatorCoreInitializator } from './default-validator.js';
import type { BatchedSubunit } from '@paima/concise';
import { hashBatchSubunit } from '@paima/concise';

class GameInputValidator {
  private core: GameInputValidatorCore;
  private pool: Pool;

  constructor(core: GameInputValidatorCore, pool: Pool) {
    this.core = core;
    this.pool = pool;
  }

  public run = async (periodMs: number): Promise<void> => {
    unsetGameInputValidatorClosed();
    while (keepRunning) {
      try {
        await Promise.all([this.validationRound(), wait(periodMs)]);
      } catch (err) {
        console.log('[GameInputValidator::run] error occurred:', err);
        if (!keepRunning) {
          break;
        }
        await wait(periodMs);
      }
    }
    setGameInputValidatorClosed();
  };

  private processInput = async (input: IGetUnvalidatedInputsResult): Promise<void> => {
    console.log('[game-input-validator] Validating input:', input.game_input);

    const validationResult = await this.core.validate(input.game_input, input.user_address);

    if (!keepRunning) {
      return;
    }

    console.log('[game-input-validator] Validation result:', validationResult);

    const userInput: BatchedSubunit = {
      addressType: input.address_type,
      userAddress: input.user_address,
      gameInput: input.game_input,
      userSignature: input.user_signature,
      millisecondTimestamp: input.millisecond_timestamp,
    };

    const hash = hashBatchSubunit(userInput);

    if (!keepRunning) {
      return;
    }

    if (validationResult === 0) {
      console.log('[game-input-validator] Accepting input!');
      await updateStateAccepted.run({ input_hash: hash }, this.pool);
      await validateInput.run({ id: input.id }, this.pool);
    } else {
      console.log('[game-input-validator] Rejecting input!');
      await updateStateRejected.run(
        {
          input_hash: hash,
          rejection_code: validationResult,
        },
        this.pool
      );
      await deleteUnvalidatedInput.run({ id: input.id }, this.pool);
    }
  };

  private validationRound = async (): Promise<void> => {
    const unvalidatedInputs = await getUnvalidatedInputs.run(undefined, this.pool);

    if (!keepRunning) {
      return;
    }

    for (let input of unvalidatedInputs) {
      try {
        await this.processInput(input);
        if (!keepRunning) {
          return;
        }
      } catch (err) {
        console.log('[game-input-validator] Error:', err);
        console.log('[game-input-validator] ...while validating input:', input);
        if (!keepRunning) {
          return;
        }
      }
    }
  };
}

export { DefaultInputValidatorCoreInitializator, EmptyInputValidatorCoreInitializator, getErrors };
export default GameInputValidator;
