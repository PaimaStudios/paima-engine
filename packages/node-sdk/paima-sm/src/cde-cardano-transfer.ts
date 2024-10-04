import { ENV, SCHEDULED_DATA_ADDRESS } from '@paima/utils';
import { createScheduledData, cdeCardanoTransferInsert } from '@paima/db';
import type { SQLUpdate } from '@paima/db';
import type { CdeCardanoTransferDatum } from './types.js';
import { BuiltinTransitions, generateRawStmInput } from '@paima/concise';
import { ConfigPrimitiveType } from '@paima/config';

export default async function processDatum(
  cdeDatum: CdeCardanoTransferDatum,
  inPresync: boolean
): Promise<SQLUpdate[]> {
  const cdeName = cdeDatum.cdeName;
  const prefix = cdeDatum.scheduledPrefix;
  const txId = cdeDatum.payload.txId;
  const rawTx = cdeDatum.payload.rawTx;
  const inputCredentials = cdeDatum.payload.inputCredentials;
  const outputs = cdeDatum.payload.outputs;
  const metadata = cdeDatum.payload.metadata;

  const scheduledBlockHeight = inPresync ? ENV.SM_START_BLOCKHEIGHT + 1 : cdeDatum.blockNumber;

  const updateList: SQLUpdate[] = [];
  if (prefix != null) {
    const scheduledInputData = generateRawStmInput(
      BuiltinTransitions[ConfigPrimitiveType.CardanoTransfer].scheduledPrefix,
      prefix,
      {
        txId,
        metadata,
        inputCredentials,
        outputs,
      }
    );
    updateList.push(
      createScheduledData(
        JSON.stringify(scheduledInputData),
        { blockHeight: scheduledBlockHeight },
        {
          cdeName: cdeDatum.cdeName,
          txHash: cdeDatum.transactionHash,
          caip2: cdeDatum.caip2,
          // TODO: this could either be inputCredentials.join(), a built-in precompile or a metadata standard
          fromAddress: SCHEDULED_DATA_ADDRESS,
          contractAddress: undefined,
        }
      )
    );
  }

  updateList.push([
    cdeCardanoTransferInsert,
    {
      cde_name: cdeName,
      tx_id: txId,
      raw_tx: rawTx,
      metadata: metadata,
    },
  ]);
  return updateList;
}
