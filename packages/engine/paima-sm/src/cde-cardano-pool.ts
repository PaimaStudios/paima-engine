import { ENV } from '@paima/utils';
import { createScheduledData, cdeCardanoPoolInsertData } from '@paima/db';
import type { SQLUpdate } from '@paima/db';
import type { CdeCardanoPoolDatum } from './types.js';

export default async function processDatum(cdeDatum: CdeCardanoPoolDatum): Promise<SQLUpdate[]> {
  const cdeId = cdeDatum.cdeId;
  const prefix = cdeDatum.scheduledPrefix;
  const address = cdeDatum.payload.address;
  const pool = cdeDatum.payload.pool;

  const scheduledBlockHeight = Math.max(cdeDatum.blockNumber, ENV.SM_START_BLOCKHEIGHT + 1);
  const scheduledInputData = `${prefix}|${address}|${pool}`;

  const updateList: SQLUpdate[] = [
    createScheduledData(scheduledInputData, scheduledBlockHeight),
    [
      cdeCardanoPoolInsertData,
      { cde_id: cdeId, address: cdeDatum.payload.address, pool: cdeDatum.payload.pool },
    ],
  ];
  return updateList;
}
