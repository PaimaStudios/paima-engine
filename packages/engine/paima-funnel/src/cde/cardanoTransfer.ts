import type { CdeCardanoTransferDatum, ChainDataExtensionCardanoTransfer } from '@paima/sm';
import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import { Routes, query } from '@dcspark/carp-client/client/src';
import type { TxAndBlockInfo } from '@dcspark/carp-client/shared/models/TransactionHistory';
import type { BlockTxPair } from 'tmp-carp-client/shared/models/common';

export const PAGINATION_LIMIT = 1000;

export default async function getCdeData(
  url: string,
  extension: ChainDataExtensionCardanoTransfer,
  fromAbsoluteSlot: number,
  toAbsoluteSlot: number,
  getBlockNumber: (slot: number) => number,
  // if we are in the presync phase, we don't care about the slots since we
  // don't need to deterministically pair this with the evm blocks, so in this
  // case we only fetch one page and break.
  isPresync: boolean,
  untilBlock: string,
  // only should be used during the presync phase, to be able to resume from the
  // previous point
  fromTx: BlockTxPair | undefined
): Promise<CdeCardanoTransferDatum[]> {
  let result = [] as CdeCardanoTransferDatum[];

  while (true) {
    const event = await timeout(
      query(url, Routes.transactionHistory, {
        // TODO: maybe it should be Output
        addresses: [extension.credential],
        slotLimits: {
          from: fromAbsoluteSlot,
          to: toAbsoluteSlot,
        },
        limit: PAGINATION_LIMIT,
        untilBlock,
        after: fromTx,
      }),
      DEFAULT_FUNNEL_TIMEOUT
    );

    const transactions = event.transactions;

    if (transactions.length > 0) {
      const last = transactions[transactions.length - 1];

      fromTx = {
        tx: last.transaction.hash,
        block: last.block.hash,
      };
    }

    transactions
      .map(e => eventToCdeDatum(e, extension, getBlockNumber(e.block.slot)))
      .forEach(element => {
        result.push(element);
      });

    if (transactions.length === 0 || isPresync) {
      break;
    }
  }

  return result;
}

function eventToCdeDatum(
  event: TxAndBlockInfo,
  extension: ChainDataExtensionCardanoTransfer,
  blockNumber: number
): CdeCardanoTransferDatum {
  const cursor: BlockTxPair = {
    block: event.block.hash,
    tx: event.transaction.hash,
  };

  return {
    cdeId: extension.cdeId,
    cdeDatumType: ChainDataExtensionDatumType.CardanoTransfer,
    blockNumber,
    payload: {
      rawTx: event.transaction.payload,
      txId: event.transaction.hash,
      outputs: event.transaction.outputs,
      inputCredentials: event.transaction.inputCredentials,
      metadata: event.transaction.metadata,
    },
    scheduledPrefix: extension.scheduledPrefix,
    paginationCursor: { cursor: JSON.stringify(cursor), finished: false },
  };
}
