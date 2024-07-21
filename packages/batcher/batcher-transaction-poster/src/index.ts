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
import { contractAbis, wait } from '@paima/utils';
import { utf8ToHex } from 'web3-utils';
import { ethers } from 'ethers';
import { BatcherStatus, BuiltinEvents, PaimaEventManager } from '@paima/events';

class BatchedTransactionPoster {
  private provider: EthersEvmProvider;
  private contractAddress: string;
  private maxSize: number;
  private pool: Pool;
  private fee: string;
  private storage: ethers.Contract;

  constructor(provider: EthersEvmProvider, contractAddress: string, maxSize: number, pool: Pool) {
    this.provider = provider;
    this.contractAddress = contractAddress;
    this.maxSize = maxSize;
    this.pool = pool;
    this.fee = ENV.DEFAULT_FEE;
    // TODO: this isn't a typed version of the contract
    //       since paima-utils still uses web3 and we haven't migrated to something like viem
    this.storage = new ethers.Contract(
      contractAddress,
      contractAbis.paimaL2ContractBuild.abi,
      provider.getConnection().api
    );
  }

  public initialize = async (): Promise<void> => {
    try {
      this.fee = await this.storage.fee();
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

  public updateWeb3 = (newProvider: EthersEvmProvider): void => {
    this.provider = newProvider;
  };

  private postMessage = async (msg: string, hashes: string[]): Promise<[number, string]> => {
    const hexMsg = utf8ToHex(msg);
    // todo: unify with buildDirectTx
    const iface = new ethers.Interface([
      'function paimaSubmitGameInput(bytes calldata data) payable',
    ]);
    const encodedData = iface.encodeFunctionData('paimaSubmitGameInput', [hexMsg]);

    const txRequest = {
      data: encodedData,
      to: this.contractAddress,
      from: this.provider.getAddress().address,
      value: '0x' + Number(this.fee).toString(16),
      gasLimit: estimateGasLimit(msg.length),
    };
    const populatedTx = await this.provider.finalizeTransaction(txRequest);
    const serializedSignedTx = ethers.Transaction.from(
      await this.provider.getConnection().api.signTransaction(populatedTx)
    );

    const [transaction] = await Promise.all([
      this.provider.sendTransaction(txRequest),
      ...this.updateMqttStatus(
        hashes,
        undefined,
        serializedSignedTx.hash ?? '',
        BatcherStatus.Posting
      ),
    ]);

    const [receipt] = await Promise.all([
      transaction.extra.wait(ENV.BATCHER_CONFIRMATIONS),
      ...this.updateMqttStatus(
        hashes,
        transaction.extra.blockNumber ?? undefined,
        transaction.txHash,
        BatcherStatus.Finalizing
      ),
    ]);

    return [receipt!.blockNumber, receipt!.hash];
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
        const postedMessage = await this.postMessage(batchedTransaction, hashes);
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

  private updateMqttStatus = (
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

export default BatchedTransactionPoster;
