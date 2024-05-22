/* @name cdeCardanoMintBurnInsert */
INSERT INTO cde_cardano_mint_burn (
  cde_name,
  tx_id,
  metadata,
  assets,
  input_addresses,
  output_addresses
) VALUES (
  :cde_name!,
  :tx_id!,
  :metadata!,
  :assets!,
  :input_addresses!,
  :output_addresses!
);