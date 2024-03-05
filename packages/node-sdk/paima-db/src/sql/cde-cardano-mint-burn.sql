/* @name cdeCardanoMintBurnInsert */
INSERT INTO cde_cardano_mint_burn (
  cde_id,
  tx_id,
  metadata,
  assets
) VALUES (
  :cde_id!,
  :tx_id!,
  :metadata!,
  :assets!
);