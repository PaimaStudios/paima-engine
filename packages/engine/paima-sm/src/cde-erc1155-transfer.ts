import { ENV } from '@paima/utils';
import type { CdeErc1155TransferDatum } from './types.js';
import { createScheduledData } from '@paima/db';
import type { SQLUpdate } from '@paima/db';

export default async function processErc1155TransferDatum(
  cdeDatum: CdeErc1155TransferDatum,
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
