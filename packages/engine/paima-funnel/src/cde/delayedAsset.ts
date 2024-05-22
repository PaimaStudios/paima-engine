import type {
  CdeCardanoAssetUtxoDatum,
  ChainDataExtensionCardanoDelayedAsset,
  ChainDataExtensionDatum,
} from '@paima/sm';
import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import { Routes, query } from '@dcspark/carp-client';
import type { AssetUtxosResponse } from '@dcspark/carp-client';
import type { BlockTxPair } from '@dcspark/carp-client';

export default async function getCdeData(
  url: string,
  extension: ChainDataExtensionCardanoDelayedAsset,
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
      query(url, Routes.assetUtxos, {
        policyIds: extension.policyIds,
        fingerprints: extension.fingerprints,
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
      .map(e => eventToCdeDatum(e, extension, getBlockNumber(e.slot), network))
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
  event: { txId: string; block: string } & AssetUtxosResponse[0]['payload'][0],
  extension: ChainDataExtensionCardanoDelayedAsset,
  blockNumber: number,
  network: string
): CdeCardanoAssetUtxoDatum {
  const cursor: BlockTxPair = {
    block: event.block,
    tx: event.txId,
  };

  return {
    cdeName: extension.cdeName,
    cdeDatumType: ChainDataExtensionDatumType.CardanoAssetUtxo,
    blockNumber,
    payload: {
      address: event.paymentCred,
      txId: event.utxo.tx,
      outputIndex: event.utxo.index,
      cip14Fingerprint: event.cip14Fingerprint,
      amount: event.amount,
      policyId: event.policyId,
      assetName: event.assetName,
    },
    network,
    paginationCursor: { cursor: JSON.stringify(cursor), finished: false },
  };
}
