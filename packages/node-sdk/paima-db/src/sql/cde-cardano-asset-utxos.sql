/* @name cdeCardanoAssetUtxosByAddress */
SELECT * FROM cde_cardano_asset_utxos 
WHERE 
  address = :address! AND cip14_fingerprint = :cip14_fingerprint!;

/* @name  cdeInsertCardanoAssetUtxo */
INSERT INTO cde_cardano_asset_utxos(
    cde_id,
    address,
    tx_id,
    output_index, 
    amount,
    cip14_fingerprint
) VALUES (
    :cde_id!,
    :address!,
    :tx_id!,
    :output_index!,
    :amount!,
    :cip14_fingerprint!
);

/* @name cdeSpendCardanoAssetUtxo */
DELETE FROM cde_cardano_asset_utxos
WHERE tx_id = :tx_id! AND output_index = :output_index!;
