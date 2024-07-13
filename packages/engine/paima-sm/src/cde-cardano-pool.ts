import { ENV } from '@paima/utils';
import { createScheduledData, cdeCardanoPoolInsertData, removeOldEntries } from '@paima/db';
import type { SQLUpdate } from '@paima/db';
import type { CdeCardanoPoolDatum } from './types.js';

export default async function processDatum(
  cdeDatum: CdeCardanoPoolDatum,
  inPresync: boolean
): Promise<SQLUpdate[]> {
  const cdeName = cdeDatum.cdeName;
  const prefix = cdeDatum.scheduledPrefix;
  const address = cdeDatum.payload.address;
  const pool = cdeDatum.payload.pool;

  const scheduledBlockHeight = inPresync ? ENV.SM_START_BLOCKHEIGHT + 1 : cdeDatum.blockNumber;
  const scheduledInputData = `${prefix}|${address}|${pool}`;

  const updateList: SQLUpdate[] = [
    createScheduledData(scheduledInputData, scheduledBlockHeight, {
      cdeName: cdeDatum.cdeName,
      txHash: cdeDatum.transactionHash,
      network: cdeDatum.network,
    }),
    [
      cdeCardanoPoolInsertData,
      {
        cde_name: cdeName,
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
    ],
  ];

  return updateList;
}
