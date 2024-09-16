import { ENV } from '@paima/batcher-utils';
import axios from 'axios';
import Web3 from 'web3';
import {
  EvmBatchedTransactionPoster,
  BatchedTransactionPosterStore,
  AvailBatchedTransactionPoster,
} from '@paima/batcher-transaction-poster';
import { BuiltinEvents, PaimaEventManager } from '@paima/events';
export class BatcherPaymentError extends Error {}

type TemporalFees = bigint[];
type Address = string;

export class BatcherPayment {
  private static isInitialized = false;

  /** In memory storage for user balances */
  private static userAddressBalance: Map<Address, TemporalFees> = new Map();

  /** Subtract funds temporally from account until updated */
  public static addTemporalGasFee(user_address: string, fee: bigint): void {
    if (fee < 0) throw new BatcherPaymentError('Expected Positive Value');
    let accountBalance = BatcherPayment.userAddressBalance.get(user_address);
    if (!accountBalance) {
      accountBalance = [];
      BatcherPayment.userAddressBalance.set(user_address, accountBalance);
    }
    accountBalance.push(fee);
  }

  /** Revert funds that where temporally subtracted from account */
  public static revertTemporalGasFee(user_address: string, fee: bigint): void {
    if (fee < 0) throw new BatcherPaymentError('Expected Positive Value');
    const accountBalance = BatcherPayment.userAddressBalance.get(user_address);
    if (!accountBalance) return;

    const index = accountBalance.indexOf(fee);
    if (index >= 0) accountBalance.splice(index, 1);
    if (accountBalance.length === 0) BatcherPayment.userAddressBalance.delete(user_address);
  }

  /** Removes best temporal match  */
  private static chargeGasFee(user_address: string, fee: bigint): void {
    if (fee < 0) throw new BatcherPaymentError('Expected Positive Value');
    const accountBalance = BatcherPayment.userAddressBalance.get(user_address);
    if (!accountBalance) return;

    const bestMatch = accountBalance
      .map(f => ({ error: f - fee, value: f }))
      .sort((a, b) => Number(a.error - b.error)) // we want to remove the closest match
      .map(f => f.value);
    bestMatch.shift();
    if (bestMatch.length === 0) BatcherPayment.userAddressBalance.delete(user_address);
    else BatcherPayment.userAddressBalance.set(user_address, bestMatch);
  }

  /** Get estimation of gas used for message */
  public static async estimateGasFee(message: string): Promise<bigint> {
    if (BatchedTransactionPosterStore.reference instanceof EvmBatchedTransactionPoster) {
      const gasUsed = await BatchedTransactionPosterStore.reference.estimateGasLimit(message);
      const weiUsed = 1000000000n * gasUsed;
      return weiUsed;
    } else if (BatchedTransactionPosterStore.reference instanceof AvailBatchedTransactionPoster) {
      console.log('NYI: estimateGasLimit is not implemented for AvailBatchedTransactionPoster');
      throw new BatcherPaymentError();
    } else {
      console.log('NYI: estimateGaLimit is not implemented for BatchedTransactionPoster');
      throw new BatcherPaymentError();
    }
  }

  /** Check if user has enough balance to pay for gas */
  public static async hasEnoughBalance(user_address: string, gasInWei: bigint): Promise<void> {
    if (!BatcherPayment.isInitialized)
      throw new BatcherPaymentError('BatcherPayment not initialized');

    const balance = await BatcherPayment.getBalance(user_address);
    if (balance <= gasInWei) throw new BatcherPaymentError();
  }

  /** Fetch current balance from game-node and subtract temporal fees  */
  public static async getBalance(user_address: string): Promise<bigint> {
    // Fetch balance from Game Node
    const address = new Web3().eth.accounts.privateKeyToAccount(ENV.BATCHER_PRIVATE_KEY);
    const url = `${ENV.GAME_NODE_URI}/batcher_payment`;
    const result = await axios.get<{ result: { balance: string } }>(url, {
      params: { batcher_address: address.address, user_address },
    });
    if (result.status < 200 || result.status >= 300)
      throw new BatcherPaymentError('Error fetching balance');

    const temporalFees = BatcherPayment.userAddressBalance.get(user_address) ?? [];
    return BigInt(result.data.result.balance) - temporalFees.reduce((a, b) => a + b, 0n);
  }

  /** Initialize BatcherPayment System. Read Paima-Events that contain real fees and added funds. */
  public static async init(): Promise<void> {
    if (BatcherPayment.isInitialized) return;
    BatcherPayment.isInitialized = true;
    const batcherAddress = new Web3().eth.accounts
      .privateKeyToAccount(ENV.BATCHER_PRIVATE_KEY)
      .address.toLocaleLowerCase();
    console.log(`Starting BatcherPayment System For Batcher Address ${batcherAddress}`);
    await PaimaEventManager.Instance.subscribe(
      { topic: BuiltinEvents.BatcherPayment, filter: { batcherAddress } },
      data => {
        const { userAddress, operation, value } = data;
        switch (operation) {
          case 'payGas':
            BatcherPayment.chargeGasFee(userAddress, BigInt(value));
            break;
          case 'addFunds':
            // Do nothing, as current balance is fetched from game-node
            break;
        }
      }
    );
  }
}

// Listen to MQTT events and update storage.
if (ENV.BATCHER_PAYMENT_ENABLED) {
  BatcherPayment.init().catch(err =>
    console.log('CRITICAL ERROR: Could not start BatcherPayment System', err)
  );
}
