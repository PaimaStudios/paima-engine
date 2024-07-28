import type { Pool } from 'pg';
import {
  getValidatedInputs,
  updateStatePosted,
  deleteValidatedInput,
  updateStateRejected,
} from '@paima/batcher-db';
import { keepRunning, gameInputValidatorClosed, webserverClosed } from '@paima/batcher-utils';
import { hashBatchSubunit, buildBatchData } from '@paima/concise';
import { wait } from '@paima/utils';
import { BatcherStatus, BuiltinEvents, PaimaEventManager } from '@paima/events';

abstract class BatchedTransactionPosterBase {
  private maxSize: number;
  private pool: Pool;

  constructor(maxSize: number, pool: Pool) {
    this.maxSize = maxSize;
    this.pool = pool;
  }

  public updateProvider = (_provider: any): void => {};

  public initialize = async (): Promise<void> => {};

  public run = async (periodMs: number): Promise<void> => {
    while (keepRunning) {
      try {
        const postedInputCount = await this.postingRound();
        if (!keepRunning) {
          break;
        }
        if (postedInputCount === 0) {
          await wait(periodMs);
        }
      } catch (err) {
        console.log('[BatchedTransactionPoster::run] error occurred:', err);
        if (!keepRunning) {
          break;
        }
        await wait(periodMs);
      }
    }

    while (true) {
      if (gameInputValidatorClosed && webserverClosed) {
        process.exit(0);
      }
      await wait(1000);
    }
  };

  abstract postMessage(_msg: string, hashes: string[]): Promise<[number, string]>;

  // Returns number of input successfully posted, or a negative number on failure.
  private postingRound = async (): Promise<number> => {
    const hashes: string[] = [];
    const ids: number[] = [];

    const batchedTransaction = await this.buildBatchedTransaction(hashes, ids);
    if (!batchedTransaction) {
      return 0;
    }

    try {
      console.log('About to paste batched transaction:');
      console.log(batchedTransaction);

      if (!keepRunning) {
        return 0;
      }

      let blockHeight: number;
      let transactionHash: string;
      try {
        const postedMessage = await this.postMessage(batchedTransaction, hashes);
        blockHeight = postedMessage[0];
        transactionHash = postedMessage[1];
        console.log('transaction posted at', blockHeight, transactionHash);
      } catch (postError) {
        console.error('Transaction batch failed. Cleaning up...');
        console.error(postError);
        await this.rejectPostedStates(hashes);
        await this.deletePostedInputs(ids);
        return ids.length;
      }

      await this.updatePostedStates(hashes, blockHeight, transactionHash);
      await this.deletePostedInputs(ids);

      if (!keepRunning) {
        return 0;
      }
    } catch (err) {
      console.log(
        `[batcher-transaction-poster] Failed to clear failed transaction. DB may be in an invalid state. Shutting down the batcher. Error:`,
        err
      );
      process.exit(1);
      return -1;
    }

    return ids.length;
  };

  private buildBatchedTransaction = async (hashes: string[], ids: number[]): Promise<string> => {
    const validatedInputs = await getValidatedInputs.run(undefined, this.pool);

    if (!keepRunning) {
      return '';
    }

    if (validatedInputs.length === 0) {
      return '';
    }

    const batchData = buildBatchData(
      this.maxSize,
      validatedInputs.map(dbInput => ({
        addressType: dbInput.address_type,
        userAddress: dbInput.user_address,
        gameInput: dbInput.game_input,
        userSignature: dbInput.user_signature,
        millisecondTimestamp: dbInput.millisecond_timestamp,
      }))
    );
    for (let i = 0; i < batchData.selectedInputs.length; i++) {
      hashes.push(hashBatchSubunit(batchData.selectedInputs[i]));
      ids.push(validatedInputs[i].id);
    }

    return batchData.data;
  };

  private updatePostedStates = async (
    hashes: string[],
    blockHeight: number,
    transactionHash: string
  ): Promise<void> => {
    await Promise.all([
      ...this.updateMqttStatus(hashes, blockHeight, transactionHash, BatcherStatus.Finalized),
      ...hashes
        .map(hash => ({
          input_hash: hash,
          block_height: blockHeight,
          transaction_hash: transactionHash,
        }))
        .map(packagedData =>
          updateStatePosted.run(packagedData, this.pool).catch(err => {
            console.log(
              "[batcher-transaction-poster] Error while updating posted inputs' states:",
              err
            );
            throw err;
          })
        ),
    ]);
  };

  protected updateMqttStatus = (
    hashes: string[],
    blockHeight: undefined | number,
    transactionHash: string,
    status: BatcherStatus
  ): Promise<void>[] => {
    return hashes.map(hash =>
      PaimaEventManager.Instance.sendMessage(BuiltinEvents.BatcherHash, {
        batch: hash,
        blockHeight,
        transactionHash,
        status,
      })
    );
  };

  private rejectPostedStates = async (hashes: string[]): Promise<void> => {
    for (let hash of hashes) {
      try {
        await updateStateRejected.run(
          {
            input_hash: hash,
            // TODO: proper error codes for this
            rejection_code: 1,
          },
          this.pool
        );
      } catch (err) {
        console.log(
          "[batcher-transaction-poster] Error while updating posted inputs' states:",
          err
        );
      }
    }
  };

  private deletePostedInputs = async (ids: number[]): Promise<void> => {
    for (let id of ids) {
      try {
        await deleteValidatedInput.run({ id: id }, this.pool);
      } catch (err) {
        console.log('[batcher-transaction-poster] Error while deleting processed inputs:', err);
        throw err;
      }
    }
  };
}

export default BatchedTransactionPosterBase;
