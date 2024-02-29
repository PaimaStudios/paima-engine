import type {
  CdeCardanoAssetUtxoDatum,
  ChainDataExtensionCardanoDelayedAsset,
  ChainDataExtensionDatum,
} from '@paima/sm';
import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import { Routes, query } from '@dcspark/carp-client/client/src';
import type { AssetUtxosResponse } from '@dcspark/carp-client/shared/models/AssetUtxos';
import { BlockTxPair } from '@dcspark/carp-client/shared/models/common';

export default async function getCdeData(
  url: string,
  extension: ChainDataExtensionCardanoDelayedAsset,
  fromAbsoluteSlot: number,
  toAbsoluteSlot: number,
  getBlockNumber: (slot: number) => number,
  isPresync: boolean,
  untilBlock: string,
  fromTx: BlockTxPair | undefined,
  paginationLimit: number
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
      .map(e => eventToCdeDatum(e, extension, getBlockNumber(e.slot)))
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
  event: AssetUtxosResponse[0],
  extension: ChainDataExtensionCardanoDelayedAsset,
  blockNumber: number
): CdeCardanoAssetUtxoDatum {
  const cursor: BlockTxPair = {
    block: event.block,
    tx: event.txId,
  };

  return {
    cdeId: extension.cdeId,
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
    paginationCursor: { cursor: JSON.stringify(cursor), finished: false },
  };
}
