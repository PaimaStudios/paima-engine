import { ENV } from '@paima/utils';
import type { CdeErc721MintDatum } from '@paima/runtime';
import { createScheduledData } from '@paima/db';
import type { SQLUpdate } from '@paima/db';

export default async function processErc721Datum(
  cdeDatum: CdeErc721MintDatum
): Promise<SQLUpdate[]> {
  const [address, prefix] = [cdeDatum.contractAddress, cdeDatum.scheduledPrefix];
  if (!prefix) {
    return [];
  }
  const { tokenId, mintData } = cdeDatum.payload;
  const scheduledBlockHeight = Math.max(cdeDatum.blockNumber, ENV.START_BLOCKHEIGHT + 1);
  const scheduledInputData = `${prefix}|${address}|${tokenId}|${mintData}`;
  return [createScheduledData(scheduledInputData, scheduledBlockHeight)];
}
