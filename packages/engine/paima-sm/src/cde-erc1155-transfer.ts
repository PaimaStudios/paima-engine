import { ENV } from '@paima/utils';
import type { CdeErc1155TransferDatum } from './types.js';
import { createScheduledData } from '@paima/db';
import type { SQLUpdate } from '@paima/db';

export default async function processErc1155TransferDatum(
  cdeDatum: CdeErc1155TransferDatum,
  inPresync: boolean
): Promise<SQLUpdate[]> {
  const { scheduledPrefix, contractAddress, payload, blockNumber } = cdeDatum;
  if (!scheduledPrefix || inPresync) {
    return [];
  }
  const { operator, from, to, ids, values } = payload;
  const scheduledBlockHeight = Math.max(blockNumber, ENV.SM_START_BLOCKHEIGHT + 1);
  const scheduledInputData = [
    scheduledPrefix,
    contractAddress,
    operator,
    from,
    to,
    JSON.stringify(ids),
    JSON.stringify(values),
  ].join("|");
  return [createScheduledData(scheduledInputData, scheduledBlockHeight)];
}
