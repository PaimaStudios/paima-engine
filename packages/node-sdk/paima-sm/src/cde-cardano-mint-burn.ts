import { ENV, SCHEDULED_DATA_ADDRESS } from '@paima/utils';
import { cdeCardanoMintBurnInsert, createScheduledData } from '@paima/db';
import type { SQLUpdate } from '@paima/db';
import type { CdeCardanoMintBurnDatum } from './types.js';
import { BuiltinTransitions, generateRawStmInput } from '@paima/concise';

export default async function processDatum(
  cdeDatum: CdeCardanoMintBurnDatum,
  inPresync: boolean
): Promise<SQLUpdate[]> {
  const cdeName = cdeDatum.cdeName;
  const prefix = cdeDatum.scheduledPrefix;
  const txId = cdeDatum.payload.txId;
  const assets = cdeDatum.payload.assets;
  const metadata = cdeDatum.payload.metadata;
  const inputAddresses = cdeDatum.payload.inputAddresses;
  const outputAddresses = cdeDatum.payload.outputAddresses;

  const scheduledBlockHeight = inPresync ? ENV.SM_START_BLOCKHEIGHT + 1 : cdeDatum.blockNumber;

  const updateList: SQLUpdate[] = [];
  if (prefix != null) {
    const scheduledInputData = generateRawStmInput(BuiltinTransitions.ChainDataExtensionCardanoMintBurnConfig, prefix, {
      txId,
      metadata,
      assets,
      inputAddresses,
      outputAddresses,
    });

    updateList.push(createScheduledData(
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
    ));
  }

  updateList.push(
    [
      cdeCardanoMintBurnInsert,
      {
        cde_name: cdeName,
        tx_id: txId,
        metadata: metadata,
        assets: cdeDatum.payload.assets,
        input_addresses: inputAddresses,
        output_addresses: outputAddresses,
      },
    ],
  );
  return updateList;
}
