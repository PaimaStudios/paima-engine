import { ENV } from '@paima/utils';
import { createScheduledData, cdeCardanoTransferInsert } from '@paima/db';
import type { SQLUpdate } from '@paima/db';
import type { CdeCardanoTransferDatum } from './types.js';

export default async function processDatum(
  cdeDatum: CdeCardanoTransferDatum
): Promise<SQLUpdate[]> {
  const cdeId = cdeDatum.cdeId;
  const prefix = cdeDatum.scheduledPrefix;
  const txId = cdeDatum.payload.txId;
  const rawTx = cdeDatum.payload.rawTx;

  const scheduledBlockHeight = Math.max(cdeDatum.blockNumber, ENV.SM_START_BLOCKHEIGHT + 1);
  const scheduledInputData = `${prefix}|${txId}|${rawTx}`;

  const updateList: SQLUpdate[] = [
    // createScheduledData(scheduledInputData, scheduledBlockHeight),
    [
      cdeCardanoTransferInsert,
      {
        cde_id: cdeId,
        tx_id: txId,
        raw_tx: rawTx,
      },
    ],
  ];
  return updateList;
}
