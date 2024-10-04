import { ENV } from '@paima/utils';
import { createScheduledData, cdeCardanoPoolInsertData, removeOldEntries } from '@paima/db';
import type { SQLUpdate } from '@paima/db';
import type { CdeCardanoPoolDatum } from './types.js';
import { BuiltinTransitions, generateRawStmInput } from '@paima/concise';
import { ConfigPrimitiveType } from '@paima/config';

export default async function processDatum(
  cdeDatum: CdeCardanoPoolDatum,
  inPresync: boolean
): Promise<SQLUpdate[]> {
  const cdeName = cdeDatum.cdeName;
  const prefix = cdeDatum.scheduledPrefix;
  const address = cdeDatum.payload.address;
  const pool = cdeDatum.payload.pool;

  const scheduledBlockHeight = inPresync ? ENV.SM_START_BLOCKHEIGHT + 1 : cdeDatum.blockNumber;
  const scheduledInputData = generateRawStmInput(
    BuiltinTransitions[ConfigPrimitiveType.CardanoDelegation].scheduledPrefix,
    prefix,
    {
      address,
      pool: pool,
    }
  );

  const updateList: SQLUpdate[] = [
    createScheduledData(
      JSON.stringify(scheduledInputData),
      { blockHeight: scheduledBlockHeight },
      {
        cdeName: cdeDatum.cdeName,
        txHash: cdeDatum.transactionHash,
        caip2: cdeDatum.caip2,
        fromAddress: address,
        contractAddress: undefined,
      }
    ),
    [
      cdeCardanoPoolInsertData,
      {
        cde_name: cdeName,
        address: cdeDatum.payload.address,
        pool: cdeDatum.payload.pool,
        epoch: cdeDatum.payload.epoch,
      },
    ],
    [
      removeOldEntries,
      {
        address: cdeDatum.payload.address,
      },
    ],
  ];

  return updateList;
}
