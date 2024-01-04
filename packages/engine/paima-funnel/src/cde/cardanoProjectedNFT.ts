import type {
  CdeCardanoProjectedNFTDatum,
  ChainDataExtensionCardanoProjectedNFT,
  ChainDataExtensionDatum,
} from '@paima/sm';
import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import { Routes, query } from '@dcspark/carp-client/client/src';
import { ProjectedNftStatus } from '@dcspark/carp-client/shared/models/ProjectedNftRange';
import type { ProjectedNftRangeResponse } from '@dcspark/carp-client/shared/models/ProjectedNftRange';

export default async function getCdeProjectedNFTData(
  url: string,
  extension: ChainDataExtensionCardanoProjectedNFT,
  fromAbsoluteSlot: number,
  toAbsoluteSlot: number,
  getBlockNumber: (slot: number) => number
): Promise<ChainDataExtensionDatum[]> {
  const events = await timeout(
    query(url, Routes.projectedNftEventsRange, {
      range: { minSlot: fromAbsoluteSlot, maxSlot: toAbsoluteSlot },
      address: undefined,
    }),
    DEFAULT_FUNNEL_TIMEOUT
  );

  return events
    .map(e => eventToCdeDatum(e, extension, getBlockNumber(e.actionSlot)))
    .filter(e => e != null)
    .map(e => e!);
}

function eventToCdeDatum(
  event: ProjectedNftRangeResponse[0],
  extension: ChainDataExtensionCardanoProjectedNFT,
  blockNumber: number
): CdeCardanoProjectedNFTDatum | null {
  if (
    event.actionTxId === null ||
    event.actionTxId == '' ||
    event.status === ProjectedNftStatus.Invalid
  ) {
    return null;
  }

  return {
    cdeId: extension.cdeId,
    cdeDatumType: ChainDataExtensionDatumType.CardanoProjectedNFT,
    blockNumber,
    payload: {
      ownerAddress: event.ownerAddress != null ? event.ownerAddress : '',

      actionTxId: event.actionTxId,
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
  };
}
