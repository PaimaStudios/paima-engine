/* @name cdeCardanoTransferInsert */
INSERT INTO cde_cardano_transfer (
  cde_name,
  tx_id,
  raw_tx,
  metadata
) VALUES (
  :cde_name!,
  :tx_id!,
  :raw_tx!,
  :metadata
);
