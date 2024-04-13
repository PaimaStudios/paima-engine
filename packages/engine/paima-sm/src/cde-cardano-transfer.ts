import { ENV } from '@paima/utils';
import { createScheduledData, cdeCardanoTransferInsert } from '@paima/db';
import type { SQLUpdate } from '@paima/db';
import type { CdeCardanoTransferDatum } from './types.js';

export default async function processDatum(
  cdeDatum: CdeCardanoTransferDatum,
  inPresync: boolean
): Promise<SQLUpdate[]> {
  const cdeId = cdeDatum.cdeId;
  const prefix = cdeDatum.scheduledPrefix;
  const txId = cdeDatum.payload.txId;
  const rawTx = cdeDatum.payload.rawTx;
  const inputCredentials = cdeDatum.payload.inputCredentials.join(',');
  const outputs = JSON.stringify(cdeDatum.payload.outputs);
  const metadata = cdeDatum.payload.metadata || undefined;

  const scheduledBlockHeight = inPresync ? ENV.SM_START_BLOCKHEIGHT + 1 : cdeDatum.blockNumber;
  const scheduledInputData = `${prefix}|${txId}|${metadata}|${inputCredentials}|${outputs}`;

  const updateList: SQLUpdate[] = [
    createScheduledData(scheduledInputData, scheduledBlockHeight),
    [
      cdeCardanoTransferInsert,
      {
        cde_id: cdeId,
        tx_id: txId,
        raw_tx: rawTx,
        metadata: metadata,
      },
    ],
  ];
  return updateList;
}
