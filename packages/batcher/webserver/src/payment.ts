import { ENV } from '@paima/batcher-utils';
import axios from 'axios';
import Web3 from 'web3';
import {
  EvmBatchedTransactionPoster,
  BatchedTransactionPosterStore,
} from '@paima/batcher-transaction-poster';
import { BuiltinEvents, PaimaEventManager } from '@paima/events';
export class BatcherPaymentError extends Error {}

type AccountBalance = { balance: bigint; temporalFees: bigint[] };

export class BatcherPayment {
  private static isInitialized = false;

  /** In memory storage for user balances */
  private static userAddressBalance: Map<string, AccountBalance> = new Map();

  /** Get account balance from memory, account must exists or error is thrown */
  private static getAccountBalance(user_address: string): AccountBalance {
    const accountBalance = BatcherPayment.userAddressBalance.get(user_address);
    if (!accountBalance) {
      throw new BatcherPaymentError();
    }
    return accountBalance;
  }

  /** Subtract funds temporally from account until updated */
  public static addTemporalGasFee(user_address: string, fee: bigint): void {
    if (fee < 0) throw new BatcherPaymentError('Expected Positive Value');
    const accountBalance = BatcherPayment.getAccountBalance(user_address);
    accountBalance.temporalFees.push(fee);
  }

  /** Revert funds that where temporally subtracted from account */
  public static revertTemporalGasFee(user_address: string, fee: bigint): void {
    if (fee < 0) throw new BatcherPaymentError('Expected Positive Value');
    const accountBalance = BatcherPayment.getAccountBalance(user_address);
    const index = accountBalance.temporalFees.indexOf(fee);
    if (index < 0) throw new BatcherPaymentError('Fee not found');
    accountBalance.temporalFees.splice(index, 1);
  }

  /** Increments account currently hold funds */
  private static addFundsToAccount(user_address: string, amount: bigint): void {
    if (amount < 0) throw new BatcherPaymentError('Expected Positive Value');
    try {
      const accountBalance = BatcherPayment.getAccountBalance(user_address);
      accountBalance.balance += amount;
    } catch {
      // If account does not exist do not add funds,
      // We need to fetch the initial balance from the game-node first.
    }
  }

  /** Subtract permanently funds from account, and removes best temporal match, from real gas usage vs estimate  */
  private static chargeGasFee(user_address: string, fee: bigint): void {
    if (fee < 0) throw new BatcherPaymentError('Expected Positive Value');
    const accountBalance = BatcherPayment.getAccountBalance(user_address);
    const bestMatch = accountBalance.temporalFees
      .map(f => ({ error: f - fee, value: f }))
      .sort((a, b) => Number(a.error - b.error)) // we want to remove the closest match
      .map(f => f.value);
    bestMatch.shift();
    accountBalance.temporalFees = bestMatch;
    accountBalance.balance -= fee;
  }

  /** Create new account in-memory */
  private static createBalanceInMemory(user_address: string, balance: bigint): void {
    const accountBalance = BatcherPayment.userAddressBalance.get(user_address);
    if (!accountBalance) {
      BatcherPayment.userAddressBalance.set(user_address, { balance, temporalFees: [] });
    }
  }

  /** Gets balance (real - temporal fees) */
  private static getBalanceFromMemory(user_address: string): bigint | null {
    const balance = BatcherPayment.userAddressBalance.get(user_address);
    if (!balance) return null;
    return balance.balance - balance.temporalFees.reduce((a, b) => a + b, BigInt(0));
  }

  /** Get estimation of gas used for message */
  public static async estimateGasFeeInWei(message: string): Promise<bigint> {
    if (BatchedTransactionPosterStore.reference instanceof EvmBatchedTransactionPoster) {
      const gasUsed = await BatchedTransactionPosterStore.reference.estimateGasLimit(message);
      const weiUsed = 1000000000n * gasUsed;
      return weiUsed;
    } else {
      console.log('estimateGasLimit only available on EVM networks');
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

  /** Tries to get balance from memory, otherwise fetches initial value from game-node */
  public static async getBalance(user_address: string): Promise<bigint> {
    // First check local cache.
    const b = BatcherPayment.getBalanceFromMemory(user_address);
    if (b !== null) return b;

    // If not in memory, fetch from node
    const address = new Web3().eth.accounts.privateKeyToAccount(ENV.BATCHER_PRIVATE_KEY);

    const url = `${ENV.GAME_NODE_URI}/batcher_payment`;

    const result = await axios.get<{ result: { balance: string } }>(url, {
      params: { batcher_address: address.address, user_address },
    });
    if (result.status < 200 || result.status >= 300)
      throw new BatcherPaymentError('Error fetching balance');

    BatcherPayment.createBalanceInMemory(user_address, BigInt(result.data.result.balance));
    return BigInt(result.data.result.balance);
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
        const { userAddress, operation, wei } = data;
        switch (operation) {
          case 'payGas':
            BatcherPayment.chargeGasFee(userAddress as string, BigInt(wei as string));
            break;
          case 'addFunds':
            BatcherPayment.addFundsToAccount(userAddress as string, BigInt(wei as string));
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
