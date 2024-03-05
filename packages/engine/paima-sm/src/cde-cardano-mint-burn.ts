import { ENV } from '@paima/utils';
import { cdeCardanoMintBurnInsert, createScheduledData } from '@paima/db';
import type { SQLUpdate } from '@paima/db';
import type { CdeCardanoMintBurnDatum } from './types.js';

export default async function processDatum(
  cdeDatum: CdeCardanoMintBurnDatum
): Promise<SQLUpdate[]> {
  const cdeId = cdeDatum.cdeId;
  const prefix = cdeDatum.scheduledPrefix;
  const txId = cdeDatum.payload.txId;
  const assets = JSON.stringify(cdeDatum.payload.assets);
  const metadata = cdeDatum.payload.metadata || undefined;

  const scheduledBlockHeight = Math.max(cdeDatum.blockNumber, ENV.SM_START_BLOCKHEIGHT + 1);
  const scheduledInputData = `${prefix}|${txId}|${metadata}|${assets}`;

  const updateList: SQLUpdate[] = [
    createScheduledData(scheduledInputData, scheduledBlockHeight),
    [
      cdeCardanoMintBurnInsert,
      {
        cde_id: cdeId,
        tx_id: txId,
        metadata: metadata,
        assets: cdeDatum.payload.assets,
      },
    ],
  ];
  return updateList;
}
