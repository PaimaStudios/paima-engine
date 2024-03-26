/* @name cdeCardanoMintBurnInsert */
INSERT INTO cde_cardano_mint_burn (
  cde_id,
  tx_id,
  metadata,
  assets,
  inputAddresses,
  outputAddresses
) VALUES (
  :cde_id!,
  :tx_id!,
  :metadata!,
  :assets!,
  :input_addresses!,
  :output_addresses!
);