/* @name cdeCardanoAssetUtxosByAddress */
SELECT * FROM cde_cardano_asset_utxos 
WHERE 
  address = :address! AND
  COALESCE(cip14_fingerprint = :cip14_fingerprint, policy_id = :policy_id, false);

/* @name  cdeInsertCardanoAssetUtxo */
INSERT INTO cde_cardano_asset_utxos(
    cde_name,
    address,
    tx_id,
    output_index, 
    amount,
    cip14_fingerprint,
    policy_id,
    asset_name
) VALUES (
    :cde_name!,
    :address!,
    :tx_id!,
    :output_index!,
    :amount!,
    :cip14_fingerprint!,
    :policy_id!,
    :asset_name
);

/* @name cdeSpendCardanoAssetUtxo */
DELETE FROM cde_cardano_asset_utxos
WHERE tx_id = :tx_id!
AND output_index = :output_index!
AND cip14_fingerprint = :cip14_fingerprint!;
