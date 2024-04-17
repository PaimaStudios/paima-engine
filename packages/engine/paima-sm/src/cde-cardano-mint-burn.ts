import { ENV } from '@paima/utils';
import { cdeCardanoMintBurnInsert, createScheduledData } from '@paima/db';
import type { SQLUpdate } from '@paima/db';
import type { CdeCardanoMintBurnDatum } from './types.js';

export default async function processDatum(
  cdeDatum: CdeCardanoMintBurnDatum,
  inPresync: boolean
): Promise<SQLUpdate[]> {
  const cdeId = cdeDatum.cdeId;
  const prefix = cdeDatum.scheduledPrefix;
  const txId = cdeDatum.payload.txId;
  const assets = JSON.stringify(cdeDatum.payload.assets);
  const metadata = cdeDatum.payload.metadata || undefined;
  const inputAddresses = cdeDatum.payload.inputAddresses;
  const outputAddresses = cdeDatum.payload.outputAddresses;

  const scheduledBlockHeight = inPresync ? ENV.SM_START_BLOCKHEIGHT + 1 : cdeDatum.blockNumber;
  const scheduledInputData = `${prefix}|${txId}|${metadata}|${assets}|${JSON.stringify(inputAddresses)}|${JSON.stringify(outputAddresses)}`;

  const updateList: SQLUpdate[] = [
    createScheduledData(scheduledInputData, scheduledBlockHeight),
    [
      cdeCardanoMintBurnInsert,
      {
        cde_id: cdeId,
        tx_id: txId,
        metadata: metadata,
        assets: cdeDatum.payload.assets,
        input_addresses: inputAddresses,
        output_addresses: outputAddresses,
      },
    ],
  ];
  return updateList;
}
