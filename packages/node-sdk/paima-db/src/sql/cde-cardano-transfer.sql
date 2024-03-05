/* @name cdeCardanoTransferInsert */
INSERT INTO cde_cardano_transfer (
  cde_id,
  tx_id,
  raw_tx,
  metadata
) VALUES (
  :cde_id!,
  :tx_id!,
  :raw_tx!,
  :metadata
);
