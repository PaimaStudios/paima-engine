/* @name cdeErc1155ModifyBalance */
INSERT INTO cde_erc1155_data (
  cde_id,
  token_id,
  wallet_address,
  balance
)
VALUES (
  :cde_id!,
  :token_id!,
  :wallet_address!,
  :value!
)
ON CONFLICT (cde_id, token_id, wallet_address)
DO UPDATE SET balance = cde_erc1155_data.balance + EXCLUDED.balance;

/* @name cdeErc1155DeleteIfZero */
DELETE FROM cde_erc1155_data
WHERE balance = 0
AND cde_id = :cde_id!
AND token_id = :token_id!
AND wallet_address = :wallet_address!;

/* @name cdeErc1155Burn */
INSERT INTO cde_erc1155_burn (
  cde_id,
  token_id,
  wallet_address,
  balance
)
VALUES (
  :cde_id!,
  :token_id!,
  :wallet_address!,
  :value!
)
ON CONFLICT (cde_id, token_id, wallet_address)
DO UPDATE SET balance = cde_erc1155_burn.balance + EXCLUDED.balance;
