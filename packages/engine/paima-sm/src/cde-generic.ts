import { ENV } from '@paima/utils';
import type { CdeGenericDatum, CdeMinaGenericDatum } from './types.js';
import { createScheduledData, cdeGenericInsertData } from '@paima/db';
import type { SQLUpdate } from '@paima/db';

export default async function processDatum(
  cdeDatum: CdeGenericDatum | CdeMinaGenericDatum,
  inPresync: boolean
): Promise<SQLUpdate[]> {
  const cdeId = cdeDatum.cdeId;
  const blockHeight = cdeDatum.blockNumber;
  const payload = cdeDatum.payload;
  const prefix = cdeDatum.scheduledPrefix;

  const scheduledBlockHeight = inPresync ? ENV.SM_START_BLOCKHEIGHT + 1 : cdeDatum.blockNumber;
  const stringifiedPayload = JSON.stringify(payload);
  const scheduledInputData = `${prefix}|${stringifiedPayload}`;

  const updateList: SQLUpdate[] = inPresync
    ? []
    : [createScheduledData(scheduledInputData, scheduledBlockHeight)];

  updateList.push([
    cdeGenericInsertData,
    { cde_id: cdeId, block_height: blockHeight, event_data: payload },
  ]);

  return updateList;
}
