import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import type {
    CdeCardanoProjectedNFTDatum,
    ChainDataExtensionCardanoProjectedNFT,
    ChainDataExtensionDatum,
} from '@paima/runtime';
import { Routes, query } from '@dcspark/carp-client/client/src';
import {ProjectedNftRangeResponse} from "@dcspark/carp-client/shared/models/ProjectedNftRange";

export default async function getCdeData(
    url: string,
    extension: ChainDataExtensionCardanoProjectedNFT,
    fromAbsoluteSlot: number,
    toAbsoluteSlot: number,
    getBlockNumber: (slot: number) => number
): Promise<ChainDataExtensionDatum[]> {
    const events = await timeout(
        query(url, Routes.projectedNftEventsRange, {
            range: { minSlot: fromAbsoluteSlot, maxSlot: toAbsoluteSlot },
        }),
        DEFAULT_FUNNEL_TIMEOUT
    );

    return events.map(e => eventToCdeDatum(e, extension, getBlockNumber(e.slot)));
}

function eventToCdeDatum(
    event: ProjectedNftRangeResponse[0],
    extension: ChainDataExtensionCardanoProjectedNFT,
    blockNumber: number
): CdeCardanoProjectedNFTDatum {
    return {
        cdeId: extension.cdeId,
        cdeDatumType: ChainDataExtensionDatumType.CardanoProjectedNFT,
        blockNumber,
        payload: {
            address: event.address,
            asset: event.asset,
            amount: event.amount,
            status: event.status,
            plutusDatum: event.plutusDatum,
        },
        scheduledPrefix: extension.scheduledPrefix,
    };
}
