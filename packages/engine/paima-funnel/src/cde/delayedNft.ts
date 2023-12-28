import type {
  CdeCardanoAssetUtxoDatum,
  ChainDataExtensionCardanoDelayedNft,
  ChainDataExtensionDatum,
} from '@paima/sm';
import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import { Routes, query } from '@dcspark/carp-client/client/src';
import { AssetUtxosResponse } from '@dcspark/carp-client/shared/models/AssetUtxos';

export default async function getCdeData(
  url: string,
  extension: ChainDataExtensionCardanoDelayedNft,
  fromAbsoluteSlot: number,
  toAbsoluteSlot: number,
  getBlockNumber: (slot: number) => number
): Promise<ChainDataExtensionDatum[]> {
  const events = await timeout(
    query(url, Routes.assetUtxos, {
      policyIds: extension.policyIds,
      fingerprints: extension.fingerprints,
      range: { minSlot: fromAbsoluteSlot, maxSlot: toAbsoluteSlot },
    }),
    DEFAULT_FUNNEL_TIMEOUT
  );

  return events.map(e => eventToCdeDatum(e, extension, getBlockNumber(e.slot)));
}

function eventToCdeDatum(
  event: AssetUtxosResponse[0],
  extension: ChainDataExtensionCardanoDelayedNft,
  blockNumber: number
): CdeCardanoAssetUtxoDatum {
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
  };
}
