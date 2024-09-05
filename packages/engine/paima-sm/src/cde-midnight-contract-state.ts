import { ENV } from '@paima/utils';
import type { CdeMidnightContractStateDatum } from './types.js';
import { createScheduledData } from '@paima/db';
import type { SQLUpdate } from '@paima/db';

export default async function processMidnightContractStateDatum(
  cdeDatum: CdeMidnightContractStateDatum,
  inPresync: boolean
): Promise<SQLUpdate[]> {
  const { scheduledPrefix, payload, blockNumber } = cdeDatum;
  const updateList: SQLUpdate[] = [];

  const scheduledBlockHeight = inPresync ? ENV.SM_START_BLOCKHEIGHT + 1 : blockNumber;
  const scheduledInputData = [scheduledPrefix, payload].join('|');
  updateList.push(
    createScheduledData(scheduledInputData, scheduledBlockHeight, {
      cdeName: cdeDatum.cdeName,
      txHash: cdeDatum.transactionHash,
      network: cdeDatum.network,
    })
  );

  return updateList;
}
