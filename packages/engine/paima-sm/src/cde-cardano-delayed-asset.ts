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
  const policy_id = cdeDatum.payload.policyId;
  const asset_name = cdeDatum.payload.assetName;

  // The amount is only set by carp when the utxo represents an output. This is
  // because for inputs the amount is already known from before.
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
          policy_id,
          asset_name,
        },
      ],
    ];
  } else {
    return [[cdeSpendCardanoAssetUtxo, { tx_id: tx_id, output_index: output_index }]];
  }
}
