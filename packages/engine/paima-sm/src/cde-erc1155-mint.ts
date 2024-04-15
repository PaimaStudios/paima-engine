import { ENV } from '@paima/utils';
import type { CdeInverseAppProjected1155MintDatum } from './types.js';
import { createScheduledData } from '@paima/db';
import type { SQLUpdate } from '@paima/db';

export default async function processInverseAppProjected1155MintDatum(
  cdeDatum: CdeInverseAppProjected1155MintDatum,
  inPresync: boolean
): Promise<SQLUpdate[]> {
  const { mintScheduledPrefix, contractAddress, payload, blockNumber } = cdeDatum;
  if (!mintScheduledPrefix || inPresync) {
    return [];
  }
  const { tokenId, minter, userTokenId, value } = payload;
  const scheduledBlockHeight = Math.max(blockNumber, ENV.SM_START_BLOCKHEIGHT + 1);
  const scheduledInputData = `${mintScheduledPrefix}|${contractAddress}|${tokenId}|${minter}|${userTokenId}|${value}`;
  return [createScheduledData(scheduledInputData, scheduledBlockHeight)];
}
