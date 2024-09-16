import type Web3 from 'web3';

import type { IBatcherBalanceUpdateParams } from '@paima/db';
import { batcherBalanceUpdate, type SQLUpdate } from '@paima/db';
import type { BatcherPaymentEvent, PaimaGameInteraction } from '@paima/utils';
import type { SubmittedData } from '@paima/chain-types';

type BatcherPaymentEventExtracted = {
  blockNumber: number;
  transactionHash: string;
  payload: { batcherAddress: string; userAddress: string; value: string };
};

export type BatcherPaymentEventPayload = {
  userAddress: string;
  batcherAddress: string;
  operation: 'payGas' | 'addFunds';
  value: string;
};

/**
 * This class processed PaimaL2Contract "Payment" events
 *  and generates the SQLUpdates & Event payload
 * */
export class BatcherPaymentEventProcessor {
  private addFundsEvents: BatcherPaymentEventExtracted[] = [];
  constructor(private events: BatcherPaymentEvent[]) {
    this.addFundsEvents = this.events.map(this.mapEvents);
  }

  public process(): {
    sqlUpdates: SQLUpdate[];
    events: BatcherPaymentEventPayload[];
  } {
    return {
      sqlUpdates: this.addFundsEvents.map(this.storeBatcherPaymentFees).flat(),
      events: this.addFundsEvents.map(this.getBatcherPaymentFees),
    };
  }

  private mapEvents(event: BatcherPaymentEvent): BatcherPaymentEventExtracted {
    return {
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      payload: {
        batcherAddress: event.returnValues.batcherAddress.toLowerCase(),
        userAddress: event.returnValues.userAddress.toLowerCase(),
        value: event.returnValues.value,
      },
    };
  }

  private getBatcherPaymentFees(event: BatcherPaymentEventExtracted): BatcherPaymentEventPayload {
    return {
      ...event.payload,
      operation: 'addFunds',
    };
  }

  private storeBatcherPaymentFees(event: BatcherPaymentEventExtracted): SQLUpdate[] {
    const { batcherAddress, userAddress, value } = event.payload;
    return [
      [
        batcherBalanceUpdate,
        {
          batcher_address: batcherAddress,
          user_address: userAddress,
          balance: value,
        } as IBatcherBalanceUpdateParams,
      ],
    ];
  }
}

/**
 * This class processes submitted data, if originated from the Batcher then
 * It will get the total gas used and split the gas cost among the users
 */
export class BatcherPaymentsFeeProcessor {
  constructor(
    private Web3: Web3,
    private events: PaimaGameInteraction[],
    private submittedData: (SubmittedData & { fromBatcher?: boolean })[]
  ) {}

  public async process(): Promise<{
    sqlUpdates: SQLUpdate[];
    events: BatcherPaymentEventPayload[];
  }> {
    const batcherSubmittedData = this.submittedData.filter(s => s.fromBatcher);
    const operations = this.splitGasCost(await this.getTotalGas(), batcherSubmittedData);
    return {
      sqlUpdates: operations.map(o => [batcherBalanceUpdate, o]),
      events: operations.map(o => ({
        userAddress: o.user_address,
        batcherAddress: o.batcher_address,
        operation: 'payGas',
        value: String(-1 * (o.balance as number)),
      })),
    };
  }

  private async getTotalGas(): Promise<
    { gasUsed: number; txHash: string; batcherAddress: string }[]
  > {
    if (this.events.length === 0) return [];

    const transactionReceipts = await Promise.all(
      this.events.map(blockEvent => this.Web3.eth.getTransactionReceipt(blockEvent.transactionHash))
    );
    return transactionReceipts.map(receipt => ({
      gasUsed: receipt.gasUsed * receipt.effectiveGasPrice,
      txHash: receipt.transactionHash,
      batcherAddress: receipt.from,
    }));
  }

  private splitGasCost(
    totalGasUsed: { gasUsed: number; txHash: string; batcherAddress: string }[],
    batchedSubmittedData: SubmittedData[]
  ): IBatcherBalanceUpdateParams[] {
    const operations: IBatcherBalanceUpdateParams[] = [];
    totalGasUsed.forEach(g => {
      const submissions = batchedSubmittedData.filter(b => b.origin.txHash === g.txHash);
      const weight = 1 / submissions.length;
      submissions.forEach(s =>
        operations.push({
          balance: -1 * weight * g.gasUsed,
          batcher_address: g.batcherAddress,
          user_address: s.realAddress,
        })
      );
    });
    return operations;
  }
}
