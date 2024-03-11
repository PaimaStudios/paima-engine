import { ENV } from '@paima/utils';
import { createScheduledData, cdeCardanoPoolInsertData, removeOldEntries } from '@paima/db';
import type { SQLUpdate } from '@paima/db';
import type { CdeCardanoPoolDatum } from './types.js';

export default async function processDatum(
  cdeDatum: CdeCardanoPoolDatum,
  inPresync: boolean
): Promise<SQLUpdate[]> {
  const cdeId = cdeDatum.cdeId;
  const prefix = cdeDatum.scheduledPrefix;
  const address = cdeDatum.payload.address;
  const pool = cdeDatum.payload.pool;

  const scheduledBlockHeight = Math.max(cdeDatum.blockNumber, ENV.SM_START_BLOCKHEIGHT + 1);
  const scheduledInputData = `${prefix}|${address}|${pool}`;

  const updateList: SQLUpdate[] = inPresync
    ? []
    : [createScheduledData(scheduledInputData, scheduledBlockHeight)];

  updateList.push(
    [
      cdeCardanoPoolInsertData,
      {
        cde_id: cdeId,
        address: cdeDatum.payload.address,
        pool: cdeDatum.payload.pool,
        epoch: cdeDatum.payload.epoch,
      },
    ],
    [
      removeOldEntries,
      {
        address: cdeDatum.payload.address,
      },
    ]
  );
  return updateList;
}
