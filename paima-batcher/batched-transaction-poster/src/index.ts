import type Web3 from 'web3';
import type { Pool } from 'pg';
import type { Contract } from 'web3-eth-contract';

import { getValidatedInputs, updateStatePosted, deleteValidatedInput } from '@paima-batcher/db';
import {
  keepRunning,
  wait,
  hashInput,
  packInput,
  getStorageContract,
  ENV,
  OUTER_DIVIDER,
  gameInputValidatorClosed,
  webserverClosed,
} from '@paima-batcher/utils';
import type { UserInput } from '@paima-batcher/utils';

import { estimateGasLimit } from './gas-limit.js';

class BatchedTransactionPoster {
  private web3: Web3;
  private contractAddress: string;
  private posterAddress: string;
  private maxSize: number;
  private pool: Pool;
  private fee: string;
  private storage: Contract;

  constructor(
    walletWeb3: Web3,
    contractAddress: string,
    posterAddress: string,
    maxSize: number,
    pool: Pool
  ) {
    this.web3 = walletWeb3;
    this.contractAddress = contractAddress;
    this.posterAddress = posterAddress;
    this.maxSize = maxSize;
    this.pool = pool;
    this.fee = ENV.DEFAULT_FEE;
    this.storage = getStorageContract(this.web3, this.contractAddress);
  }

  public initialize = async (): Promise<void> => {
    try {
      this.fee = await this.storage.methods.fee().call();
    } catch (err) {
      console.log(
        '[batched-transaction-poster] Error while retreiving fee, reverting to default:',
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
        console.log('[BatchedTransactionPoster::run] error occured:', err);
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

  public updateWeb3 = (newWeb3: Web3): void => {
    this.web3 = newWeb3;
  };

  private postMessage = async (msg: string): Promise<[number, string]> => {
    const hexMsg = this.web3.utils.utf8ToHex(msg);
    const tx = {
      data: this.storage.methods.paimaSubmitGameInput(hexMsg).encodeABI(),
      to: this.contractAddress,
      from: this.posterAddress,
      value: this.web3.utils.numberToHex(this.fee),
      gas: estimateGasLimit(msg.length),
    };
    return await this.web3.eth
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

      const [blockHeight, transactionHash] = await this.postMessage(batchedTransaction);

      await this.updatePostedStates(hashes, blockHeight, transactionHash);
      await this.deletePostedInputs(ids);

      if (!keepRunning) {
        return 0;
      }
    } catch (err) {
      console.log('[batched-transaction-poster] Error while posting batched input:', err);
      return -1;
    }

    return ids.length;
  };

  private buildBatchedTransaction = async (hashes: string[], ids: number[]): Promise<string> => {
    let batchedTransaction = 'B';
    let remainingSpace = this.maxSize - 1;

    const validatedInputs = await getValidatedInputs.run(undefined, this.pool);

    if (!keepRunning) {
      return '';
    }

    if (validatedInputs.length === 0) {
      return '';
    }

    for (let input of validatedInputs) {
      try {
        const userInput: UserInput = {
          addressType: input.address_type,
          userAddress: input.user_address,
          gameInput: input.game_input,
          userSignature: input.user_signature,
          millisecondTimestamp: input.millisecond_timestamp,
        };
        const packed = packInput(userInput);
        if (packed.length + 1 > remainingSpace) {
          break;
        }

        batchedTransaction += OUTER_DIVIDER;
        batchedTransaction += packed;
        remainingSpace -= packed.length + 1;
        hashes.push(hashInput(userInput));
        ids.push(input.id);
      } catch (err) {
        console.log('[batched-transaction-poster] Error while batching input:', err);
      }
      if (!keepRunning) {
        return '';
      }
    }

    return batchedTransaction;
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
      }
    }
  };

  private deletePostedInputs = async (ids: number[]): Promise<void> => {
    for (let id of ids) {
      try {
        await deleteValidatedInput.run({ id: id }, this.pool);
      } catch (err) {
        console.log('[batched-transaction-poster] Error while deleting processed inputs:', err);
      }
    }
  };
}

export default BatchedTransactionPoster;
