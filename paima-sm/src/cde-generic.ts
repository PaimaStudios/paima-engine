import type { Pool } from 'pg';

import { doLog, ENV } from '@paima/utils';
import type { CdeGenericDatum } from '@paima/runtime';
import { createScheduledData, cdeGenericInsertData } from '@paima/db';
import type { SQLUpdate } from '@paima/db';

export default async function processDatum(cdeDatum: CdeGenericDatum): Promise<SQLUpdate[]> {
  const cdeId = cdeDatum.cdeId;
  const blockHeight = cdeDatum.blockNumber;
  const payload = cdeDatum.payload;
  const prefix = cdeDatum.scheduledPrefix;

  const scheduledBlockHeight = Math.max(cdeDatum.blockNumber, ENV.START_BLOCKHEIGHT + 1);
  const stringifiedPayload = JSON.stringify(payload);
  const scheduledInputData = `${prefix}|${stringifiedPayload}`;

  const updateList: SQLUpdate[] = [
    createScheduledData(scheduledInputData, scheduledBlockHeight),
    [cdeGenericInsertData, { cde_id: cdeId, block_height: blockHeight, event_data: payload }],
  ];
  return updateList;
}
