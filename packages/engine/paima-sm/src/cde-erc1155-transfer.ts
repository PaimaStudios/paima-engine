import { ENV } from '@paima/utils';
import type { CdeInverseAppProjected1155TransferDatum } from './types.js';
import { createScheduledData } from '@paima/db';
import type { SQLUpdate } from '@paima/db';

export default async function processInverseAppProjected1155TransferDatum(
  cdeDatum: CdeInverseAppProjected1155TransferDatum,
  inPresync: boolean
): Promise<SQLUpdate[]> {
  const { transferScheduledPrefix, contractAddress, payload, blockNumber } = cdeDatum;
  if (!transferScheduledPrefix || inPresync) {
    return [];
  }
  const { operator, from, to, id, value } = payload;
  const scheduledBlockHeight = Math.max(blockNumber, ENV.SM_START_BLOCKHEIGHT + 1);
  const scheduledInputData = `${transferScheduledPrefix}|${contractAddress}|${operator}|${from}|${to}|${id}|${value}`;
  return [createScheduledData(scheduledInputData, scheduledBlockHeight)];
}
