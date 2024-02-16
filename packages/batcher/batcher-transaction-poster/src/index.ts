import type { Pool } from 'pg';

import {
  getValidatedInputs,
  updateStatePosted,
  deleteValidatedInput,
  updateStateRejected,
} from '@paima/batcher-db';
import { keepRunning, ENV, gameInputValidatorClosed, webserverClosed } from '@paima/batcher-utils';
import type { EthersEvmProvider } from '@paima/providers';

import { estimateGasLimit } from './gas-limit.js';
import { hashBatchSubunit, buildBatchData } from '@paima/concise';
import { wait } from '@paima/utils';
import { utf8ToHex } from 'web3-utils';
import ethers from 'ethers';
import paimaL2ContractBuild from './PaimaL2Contract.js';

class BatchedTransactionPoster {
  private provider: EthersEvmProvider;
  private contractAddress: string;
  private maxSize: number;
  private pool: Pool;
  private fee: string;
  private storage: ethers.ethers.Contract;

  constructor(
    provider: EthersEvmProvider,
    contractAddress: string,
    maxSize: number,
    pool: Pool
  ) {
    this.provider = provider;
    this.contractAddress = contractAddress;
    this.maxSize = maxSize;
    this.pool = pool;
    this.fee = ENV.DEFAULT_FEE;
    // TODO: replace this with something more proper
    this.storage = new ethers.Contract(contractAddress, paimaL2ContractBuild.abi, 
      provider.getConnection().api as any
    );
  }

  public initialize = async (): Promise<void> => {
    try {
      this.fee = await this.storage.fee().call();
    } catch (err) {
      console.log(
        '[batcher-transaction-poster] Error while retrieving fee, reverting to default:',
        err
      );
      this.fee = ENV.DEFAULT_FEE;
    }
  };

  public run = async (periodMs: number): Promise<void> => {
    while (keepRunning) {
      try {
        console.log('[BatchedTransactionPoster::run] posting start');
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
      console.log('[BatchedTransactionPoster::run] run end');
    }

    while (true) {
      if (gameInputValidatorClosed && webserverClosed) {
        process.exit(0);
      }
      await wait(1000);
    }
  };

  public updateWeb3 = (newProvider: EthersEvmProvider): void => {
    this.provider = newProvider;
  };

  private postMessage = async (msg: string): Promise<[number, string]> => {
    const hexMsg = utf8ToHex(msg);
    // todo: @paima/provider should probably return block info instead of just tx hash
    // so we don't have to copy-paste this
    const nonce = await this.provider.getConnection().api.getTransactionCount(
      this.provider.getAddress().address
    );
    const result = await this.provider.getConnection().api.sendTransaction({
      data: this.storage.methods.paimaSubmitGameInput(hexMsg).encodeABI(),
      to: this.contractAddress,
      from: this.provider.getAddress().address,
      value: '0x' + Number(this.fee).toString(16),
      gasLimit: estimateGasLimit(msg.length),
      nonce,
    });
    return [result.blockNumber!, result.hash];
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

    const truncatedInputs = validatedInputs.slice(0, Math.min(10, validatedInputs.length));
    console.log('buildBatchedTransaction', truncatedInputs, keepRunning);
    if (!keepRunning) {
      return '';
    }

    if (truncatedInputs.length === 0) {
      return '';
    }

    const batchData = buildBatchData(
      this.maxSize,
      truncatedInputs.map(dbInput => ({
        addressType: dbInput.address_type,
        userAddress: dbInput.user_address,
        gameInput: dbInput.game_input,
        userSignature: dbInput.user_signature,
        millisecondTimestamp: dbInput.millisecond_timestamp,
      }))
    );
    for (let i = 0; i < batchData.selectedInputs.length; i++) {
      hashes.push(hashBatchSubunit(batchData.selectedInputs[i]));
      ids.push(truncatedInputs[i].id);
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
          "[batcher-transaction-poster] Error while updating posted inputs' states:",
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

export default BatchedTransactionPoster;
