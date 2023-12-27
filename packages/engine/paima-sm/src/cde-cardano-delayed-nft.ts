import { cdeInsertCardanoAssetUtxo, cdeSpendCardanoAssetUtxo } from '@paima/db';
import type { SQLUpdate } from '@paima/db';
import type { CdeCardanoAssetUtxoDatum } from './types.js';

export default async function processDatum(
  cdeDatum: CdeCardanoAssetUtxoDatum
): Promise<SQLUpdate[]> {
  const cdeId = cdeDatum.cdeId;
  const address = cdeDatum.payload.address;
  const amount = cdeDatum.payload.amount;
  const tx_id = cdeDatum.payload.txId;
  const output_index = cdeDatum.payload.outputIndex;
  const cip14_fingerprint = cdeDatum.payload.cip14Fingerprint;

  if (amount) {
    return [
      [
        cdeInsertCardanoAssetUtxo,
        {
          cde_id: cdeId,
          address: address,
          tx_id: tx_id,
          output_index: output_index,
          amount,
          cip14_fingerprint,
        },
      ],
    ];
  } else {
    return [[cdeSpendCardanoAssetUtxo, { tx_id: tx_id, output_index: output_index }]];
  }
}
