import type {
  CdeCardanoPoolDatum,
  ChainDataExtensionCardanoDelegation,
  ChainDataExtensionDatum,
} from '@paima/sm';
import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import { Routes, query } from '@dcspark/carp-client/client/src';
import type { DelegationForPoolResponse } from '@dcspark/carp-client/shared/models/DelegationForPool';

export default async function getCdeData(
  url: string,
  extension: ChainDataExtensionCardanoDelegation,
  fromAbsoluteSlot: number,
  toAbsoluteSlot: number,
  getBlockNumber: (slot: number) => number
): Promise<ChainDataExtensionDatum[]> {
  const events = await timeout(
    query(url, Routes.delegationForPool, {
      pools: extension.pools,
      range: { minSlot: fromAbsoluteSlot, maxSlot: toAbsoluteSlot },
    }),
    DEFAULT_FUNNEL_TIMEOUT
  );

  return events.map(e => eventToCdeDatum(e, extension, getBlockNumber(e.slot)));
}

function eventToCdeDatum(
  event: DelegationForPoolResponse[0],
  extension: ChainDataExtensionCardanoDelegation,
  blockNumber: number
): CdeCardanoPoolDatum {
  return {
    cdeId: extension.cdeId,
    cdeDatumType: ChainDataExtensionDatumType.CardanoPool,
    blockNumber,
    payload: {
      address: event.credential,
      pool: event.pool || undefined,
    },
    scheduledPrefix: extension.scheduledPrefix,
  };
}
