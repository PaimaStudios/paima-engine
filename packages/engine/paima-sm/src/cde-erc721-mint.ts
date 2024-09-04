import { ENV } from '@paima/utils';
import type { CdeErc721MintDatum } from './types.js';
import { createScheduledData } from '@paima/db';
import type { SQLUpdate } from '@paima/db';

export default async function processErc721Datum(
  cdeDatum: CdeErc721MintDatum,
  inPresync: boolean
): Promise<SQLUpdate[]> {
  const [address, prefix] = [cdeDatum.contractAddress, cdeDatum.scheduledPrefix];
  if (!prefix) {
    return [];
  }
  const { tokenId, mintData } = cdeDatum.payload;
  const scheduledBlockHeight = inPresync ? ENV.SM_START_BLOCKHEIGHT + 1 : cdeDatum.blockNumber;
  const scheduledInputData = `${prefix}|${address}|${tokenId}|${mintData}`;
  return [
    createScheduledData(scheduledInputData, scheduledBlockHeight, {
      cdeName: cdeDatum.cdeName,
      txHash: cdeDatum.transactionHash,
      caip2: cdeDatum.caip2,
      fromAddress: cdeDatum.payload.from,
      contractAddress: cdeDatum.contractAddress,
    }),
  ];
}
