import { ENV, SCHEDULED_DATA_ADDRESS } from '@paima/utils';
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

  const scheduledBlockHeight = inPresync ? ENV.SM_START_BLOCKHEIGHT + 1 : cdeDatum.blockNumber;

  const stringifiedPayload = JSON.stringify(payload);
  const scheduledInputData = `${prefix}|${stringifiedPayload}`;

  const updateList: SQLUpdate[] = [
    createScheduledData(scheduledInputData, scheduledBlockHeight, {
      cdeName: cdeDatum.cdeName,
      txHash: cdeDatum.transactionHash,
      caip2: cdeDatum.caip2,
      // TODO: what to set this to?
      //       - sender address (requires a eth_getTransactionByHash call)
      //       - some standard (ex: some way to specify which field in the ABI is the from address)
      //       - contract address
      fromAddress: SCHEDULED_DATA_ADDRESS,
      contractAddress: 'contractAddress' in cdeDatum ? cdeDatum.contractAddress : undefined,
    }),
  ];

  updateList.push([
    cdeGenericInsertData,
    { cde_name: cdeName, block_height: blockHeight, event_data: payload },
  ]);

  return updateList;
}
