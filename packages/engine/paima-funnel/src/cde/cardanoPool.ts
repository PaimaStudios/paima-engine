import type { CdeCardanoPoolDatum, ChainDataExtensionCardanoDelegation } from '@paima/sm';
import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import { Routes, query } from '@dcspark/carp-client/client/src';
import type { DelegationForPoolResponse } from '@dcspark/carp-client/shared/models/DelegationForPool';
import type { BlockTxPair } from '@dcspark/carp-client';

export default async function getCdeData(
  url: string,
  extension: ChainDataExtensionCardanoDelegation,
  fromAbsoluteSlot: number,
  toAbsoluteSlot: number,
  getBlockNumber: (slot: number) => number,
  absoluteSlotToEpoch: (slot: number) => number,
  isPresync: boolean,
  untilBlock: string,
  fromTx: BlockTxPair | undefined,
  paginationLimit: number,
  network: string
): Promise<CdeCardanoPoolDatum[]> {
  let result = [] as CdeCardanoPoolDatum[];

  while (true) {
    const events = await timeout(
      query(url, Routes.delegationForPool, {
        pools: extension.pools,
        slotLimits: {
          from: fromAbsoluteSlot,
          to: toAbsoluteSlot,
        },
        limit: paginationLimit,
        untilBlock,
        after: fromTx,
      }),
      DEFAULT_FUNNEL_TIMEOUT
    );

    if (events.length > 0) {
      const last = events[events.length - 1];

      fromTx = {
        tx: last.txId,
        block: last.block,
      };
    }

    events
      .flatMap(event =>
        event.payload.map(payload => ({ txId: event.txId, block: event.block, ...payload }))
      )
      .map(e =>
        eventToCdeDatum(e, extension, getBlockNumber(e.slot), absoluteSlotToEpoch(e.slot), network)
      )
      .forEach(element => {
        result.push(element);
      });

    if (events.length === 0 || isPresync) {
      break;
    }
  }

  return result;
}

function eventToCdeDatum(
  event: { txId: string; block: string } & DelegationForPoolResponse[0]['payload'][0],
  extension: ChainDataExtensionCardanoDelegation,
  blockNumber: number,
  epoch: number,
  network: string
): CdeCardanoPoolDatum {
  const cursor: BlockTxPair = {
    block: event.block,
    tx: event.txId,
  };

  return {
    cdeId: extension.cdeId,
    cdeDatumType: ChainDataExtensionDatumType.CardanoPool,
    blockNumber,
    transactionHash: event.txId,
    payload: {
      address: event.credential,
      pool: event.pool || undefined,
      epoch,
    },
    scheduledPrefix: extension.scheduledPrefix,
    network,
    paginationCursor: { cursor: JSON.stringify(cursor), finished: false },
  };
}
