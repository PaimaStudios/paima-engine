import { ChainDataExtensionDatumType, ENV } from '@paima/utils';
import type {
  CdeGenericDatum,
  CdeMinaActionGenericDatum,
  CdeMinaEventGenericDatum,
} from './types.js';
import { createScheduledData, cdeGenericInsertData } from '@paima/db';
import type { SQLUpdate } from '@paima/db';

export default async function processDatum(
  cdeDatum: CdeGenericDatum | CdeMinaEventGenericDatum | CdeMinaActionGenericDatum,
  inPresync: boolean
): Promise<SQLUpdate[]> {
  const cdeName = cdeDatum.cdeName;
  const blockHeight = cdeDatum.blockNumber;
  const payload = cdeDatum.payload;
  const prefix = cdeDatum.scheduledPrefix;
  const shouldIncludeName =
    cdeDatum.cdeDatumType === ChainDataExtensionDatumType.Generic ? cdeDatum.includeName : false;

  const scheduledBlockHeight = inPresync ? ENV.SM_START_BLOCKHEIGHT + 1 : cdeDatum.blockNumber;
  const stringifiedPayload = JSON.stringify(payload);
  const scheduledInputData = `${prefix}|${stringifiedPayload}`;

  const updateList: SQLUpdate[] = inPresync
    ? []
    : [
        createScheduledData(
          scheduledInputData,
          scheduledBlockHeight,
          cdeDatum.transactionHash,
          shouldIncludeName ? cdeDatum.cdeName : undefined
        ),
      ];

  updateList.push([
    cdeGenericInsertData,
    { cde_name: cdeName, block_height: blockHeight, event_data: payload },
  ]);

  return updateList;
}
