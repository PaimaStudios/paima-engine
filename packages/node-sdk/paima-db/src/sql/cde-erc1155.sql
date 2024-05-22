/* @name cdeErc1155ModifyBalance */
INSERT INTO cde_erc1155_data (
  cde_name,
  token_id,
  wallet_address,
  balance
)
VALUES (
  :cde_name!,
  :token_id!,
  :wallet_address!,
  :value!
)
ON CONFLICT (cde_name, token_id, wallet_address)
DO UPDATE SET balance = CAST(cde_erc1155_data.balance AS NUMERIC) + CAST(EXCLUDED.balance AS NUMERIC);

/* @name cdeErc1155DeleteIfZero */
DELETE FROM cde_erc1155_data
WHERE balance = '0'
AND cde_name = :cde_name!
AND token_id = :token_id!
AND wallet_address = :wallet_address!;

/* @name cdeErc1155Burn */
INSERT INTO cde_erc1155_burn (
  cde_name,
  token_id,
  wallet_address,
  balance
)
VALUES (
  :cde_name!,
  :token_id!,
  :wallet_address!,
  :value!
)
ON CONFLICT (cde_name, token_id, wallet_address)
DO UPDATE SET balance = CAST(cde_erc1155_burn.balance AS NUMERIC) + CAST(EXCLUDED.balance AS NUMERIC);

/* @name cdeErc1155GetAllTokens */
SELECT * from cde_erc1155_data
WHERE cde_name = :cde_name!
AND wallet_address = :wallet_address!
AND CAST(balance AS NUMERIC) > 0
;

/* @name cdeErc1155GetByTokenId */
SELECT * from cde_erc1155_data
WHERE cde_name = :cde_name!
AND token_id = :token_id!
;

/* @name cdeErc1155GetByTokenIdAndWallet */
SELECT * from cde_erc1155_data
WHERE cde_name = :cde_name!
AND wallet_address = :wallet_address!
AND token_id = :token_id!
;
