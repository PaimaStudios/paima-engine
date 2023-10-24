import type {
  CdeCardanoPoolDatum,
  ChainDataExtensionCardanoDelegation,
  ChainDataExtensionDatum,
} from '@paima/sm';
import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import axios from 'axios';

interface ApiResult {
  credential: string;
  pool: string | undefined;
  slot: number;
}

export default async function getCdeData(
  url: string,
  extension: ChainDataExtensionCardanoDelegation,
  fromAbsoluteSlot: number,
  toAbsoluteSlot: number,
  getBlockNumber: (slot: number) => number
): Promise<ChainDataExtensionDatum[]> {
  const events = await timeout(
    // TODO: replace with the carp client later
    axios.post<ApiResult[]>(url, {
      pools: extension.pools,
      range: { minSlot: fromAbsoluteSlot, maxSlot: toAbsoluteSlot },
    }),
    DEFAULT_FUNNEL_TIMEOUT
  );

  return events.data.map(e => eventToCdeDatum(e, extension, getBlockNumber(e.slot)));
}

function eventToCdeDatum(
  event: ApiResult,
  extension: ChainDataExtensionCardanoDelegation,
  blockNumber: number
): CdeCardanoPoolDatum {
  return {
    cdeId: extension.cdeId,
    cdeDatumType: ChainDataExtensionDatumType.CardanoPool,
    blockNumber,
    payload: {
      address: event.credential,
      pool: event.pool,
    },
    scheduledPrefix: extension.scheduledPrefix,
  };
}
