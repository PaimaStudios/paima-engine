import type { Pool } from 'pg';
import type { Contract } from 'web3-eth-contract';

import {
  getValidatedInputs,
  updateStatePosted,
  deleteValidatedInput,
  updateStateRejected,
} from '@paima-batcher/db';
import {
  keepRunning,
  wait,
  getStorageContract,
  ENV,
  gameInputValidatorClosed,
  webserverClosed,
} from '@paima-batcher/utils';
import type { TruffleEvmProvider } from '@paima/providers';

import { estimateGasLimit } from './gas-limit.js';
import { hashBatchSubunit, buildBatchData } from '@paima/concise';

class BatchedTransactionPoster {
  private truffleProvider: TruffleEvmProvider;
  private contractAddress: string;
  private maxSize: number;
  private pool: Pool;
  private fee: string;
  private storage: Contract;

  constructor(
    truffleProvider: TruffleEvmProvider,
    contractAddress: string,
    maxSize: number,
    pool: Pool
  ) {
    this.truffleProvider = truffleProvider;
    this.contractAddress = contractAddress;
    this.maxSize = maxSize;
    this.pool = pool;
    this.fee = ENV.DEFAULT_FEE;
    this.storage = getStorageContract(truffleProvider.web3, this.contractAddress);
  }

  public initialize = async (): Promise<void> => {
    try {
      this.fee = await this.storage.methods.fee().call();
    } catch (err) {
      console.log(
        '[batched-transaction-poster] Error while retrieving fee, reverting to default:',
        err
      );
      this.fee = ENV.DEFAULT_FEE;
    }
  };

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

  public updateWeb3 = (newTruffleProvider: TruffleEvmProvider): void => {
    this.truffleProvider = newTruffleProvider;
  };

  private postMessage = async (msg: string): Promise<[number, string]> => {
    const hexMsg = this.truffleProvider.web3.utils.utf8ToHex(msg);
    const tx = {
      data: this.storage.methods.paimaSubmitGameInput(hexMsg).encodeABI(),
      to: this.contractAddress,
      from: this.truffleProvider.getAddress(),
      value: this.truffleProvider.web3.utils.numberToHex(this.fee),
      gas: estimateGasLimit(msg.length),
    };
    return await this.truffleProvider.web3.eth
      .sendTransaction(tx)
      .then(receipt => [receipt.blockNumber, receipt.transactionHash]);
  };

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
        const postedMessage = await this.postMessage(batchedTransaction);
        blockHeight = postedMessage[0];
        transactionHash = postedMessage[1];
      } catch (postError) {
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
        `[batched-transaction-poster] Failed to clear failed transaction. DB may be in an invalid state. Shutting down the batcher. Error:`,
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
    for (let hash of hashes) {
      try {
        await updateStatePosted.run(
          {
            input_hash: hash,
            block_height: blockHeight,
            transaction_hash: transactionHash,
          },
          this.pool
        );
      } catch (err) {
        console.log(
          "[batched-transaction-poster] Error while updating posted inputs' states:",
          err
        );
        throw err;
      }
    }
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
          "[batched-transaction-poster] Error while updating posted inputs' states:",
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
        console.log('[batched-transaction-poster] Error while deleting processed inputs:', err);
        throw err;
      }
    }
  };
}

export default BatchedTransactionPoster;
