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
DO UPDATE SET balance = CAST(cde_erc1155_data.balance AS NUMERIC) + CAST(EXCLUDED.balance AS NUMERIC);

/* @name cdeErc1155DeleteIfZero */
DELETE FROM cde_erc1155_data
WHERE balance = '0'
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
DO UPDATE SET balance = CAST(cde_erc1155_burn.balance AS NUMERIC) + CAST(EXCLUDED.balance AS NUMERIC);

/* @name cdeErc1155GetTotalBalanceAllTokens */
SELECT sum(CAST(balance AS NUMERIC)) as total from cde_erc1155_data
WHERE cde_id = :cde_id!
AND wallet_address = :wallet_address!
;

/* @name cdeErc1155GetAllTokens */
SELECT * from cde_erc1155_data
WHERE cde_id = :cde_id!
AND wallet_address = :wallet_address!
AND CAST(balance AS NUMERIC) > 0
;

/* @name cdeErc1155GetByTokenId */
SELECT * from cde_erc1155_data
WHERE cde_id = :cde_id!
AND wallet_address = :wallet_address!
AND token_id = :token_id!
;
