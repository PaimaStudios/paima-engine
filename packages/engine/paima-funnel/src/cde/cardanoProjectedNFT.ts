import type {
  CdeCardanoProjectedNFTDatum,
  ChainDataExtensionCardanoProjectedNFT,
  ChainDataExtensionDatum,
} from '@paima/sm';
import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import { Routes, query } from '@dcspark/carp-client';
import { ProjectedNftStatus } from '@dcspark/carp-client';
import type { ProjectedNftRangeResponse } from '@dcspark/carp-client';
import type { BlockTxPair } from '@dcspark/carp-client';

export default async function getCdeProjectedNFTData(
  url: string,
  extension: ChainDataExtensionCardanoProjectedNFT,
  fromAbsoluteSlot: number,
  toAbsoluteSlot: number,
  getBlockNumber: (slot: number) => number,
  isPresync: boolean,
  untilBlock: string,
  fromTx: BlockTxPair | undefined,
  paginationLimit: number,
  network: string
): Promise<ChainDataExtensionDatum[]> {
  let result = [] as ChainDataExtensionDatum[];

  while (true) {
    const events = await timeout(
      query(url, Routes.projectedNftEventsRange, {
        address: undefined,
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
      .map(e => eventToCdeDatum(e, extension, getBlockNumber(e.actionSlot), network))
      .filter(e => e != null)
      .map(e => e!)
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
  event: { txId: string; block: string } & ProjectedNftRangeResponse[0]['payload'][0],
  extension: ChainDataExtensionCardanoProjectedNFT,
  blockNumber: number,
  network: string
): CdeCardanoProjectedNFTDatum | null {
  if (event.txId === null || event.txId == '' || event.status === ProjectedNftStatus.Invalid) {
    return null;
  }

  const cursor: BlockTxPair = {
    block: event.block,
    tx: event.txId,
  };

  return {
    cdeId: extension.cdeId,
    cdeDatumType: ChainDataExtensionDatumType.CardanoProjectedNFT,
    blockNumber,
    transactionHash: event.txId,
    payload: {
      ownerAddress: event.ownerAddress != null ? event.ownerAddress : '',

      actionTxId: event.txId,
      actionOutputIndex: event.actionOutputIndex != null ? event.actionOutputIndex : undefined,

      previousTxHash: event.previousTxHash != null ? event.previousTxHash : undefined,
      previousTxOutputIndex:
        event.previousTxOutputIndex != null ? event.previousTxOutputIndex : undefined,

      policyId: event.policyId,
      assetName: event.assetName,
      amount: event.amount,
      status: event.status,
      plutusDatum: event.plutusDatum != null ? event.plutusDatum : '',

      forHowLong: event.forHowLong != null ? event.forHowLong : undefined,
    },
    scheduledPrefix: extension.scheduledPrefix,
    network,
    paginationCursor: { cursor: JSON.stringify(cursor), finished: false },
  };
}
