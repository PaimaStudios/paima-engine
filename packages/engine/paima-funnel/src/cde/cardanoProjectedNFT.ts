import type {
    CdeCardanoProjectedNFTDatum,
    ChainDataExtensionCardanoProjectedNFT,
    ChainDataExtensionDatum,
} from '@paima/sm';
import { ChainDataExtensionDatumType, DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import { Routes, query } from '@dcspark/carp-client/client/src';
import type { ProjectedNftRangeResponse } from "@dcspark/carp-client/shared/models/ProjectedNftRange";

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

    return events.map(e => eventToCdeDatum(e, extension, getBlockNumber(e.actionSlot))).filter(e => e != null).map(e => e!!);
}

function eventToCdeDatum(
    event: ProjectedNftRangeResponse[0],
    extension: ChainDataExtensionCardanoProjectedNFT,
    blockNumber: number
): CdeCardanoProjectedNFTDatum | null {
    if (event.ownerAddress == null || event.actionTxId == null || event.status == null) {
        return null;
    }

    return {
        cdeId: extension.cdeId,
        cdeDatumType: ChainDataExtensionDatumType.CardanoProjectedNFT,
        blockNumber,
        payload: {
            ownerAddress: event.ownerAddress!!,

            actionTxId: event.actionTxId,
            actionOutputIndex: event.actionOutputIndex || undefined,

            previousTxHash: event.previousTxHash || undefined,
            previousTxOutputIndex: event.previousTxOutputIndex || undefined,

            asset: event.asset,
            amount: event.amount,
            status: event.status,
            plutusDatum: event.plutusDatum || "",

            forHowLong: event.forHowLong || undefined,
        },
        scheduledPrefix: extension.scheduledPrefix,
    };
}
