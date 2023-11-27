import { ENV } from '@paima/utils';
import type { CdeCardanoProjectedNFTDatum } from '@paima/runtime';
import { createScheduledData, cdeCardanoProjectedNftInsertData } from '@paima/db';
import type { SQLUpdate } from '@paima/db';

export default async function processDatum(cdeDatum: CdeCardanoProjectedNFTDatum): Promise<SQLUpdate[]> {
    const cdeId = cdeDatum.cdeId;
    const prefix = cdeDatum.scheduledPrefix;
    const address = cdeDatum.payload.address;
    const amount = cdeDatum.payload.amount;
    const asset = cdeDatum.payload.asset;
    const status = cdeDatum.payload.status;
    const datum = cdeDatum.payload.plutusDatum;

    const scheduledBlockHeight = Math.max(cdeDatum.blockNumber, ENV.SM_START_BLOCKHEIGHT + 1);
    const scheduledInputData = `${prefix}|${address}|${asset}|${amount}|${status}|${datum}`;

    const updateList: SQLUpdate[] = [
        createScheduledData(scheduledInputData, scheduledBlockHeight),
        [
            cdeCardanoProjectedNftInsertData,
            {
                cde_id: cdeId,
                address: cdeDatum.payload.address,
                asset: cdeDatum.payload.asset,
                amount: cdeDatum.payload.amount,
                status: cdeDatum.payload.status,
                datum: cdeDatum.payload.plutusDatum
            },
        ],
    ];
    return updateList;
}
