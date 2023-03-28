/* @name cdeErc20GetBalance */
SELECT * FROM cde_erc20_data
WHERE cde_id = :cde_id
AND wallet_address = :wallet_address;

/* @name cdeErc20InsertBalance */
INSERT INTO cde_erc20_data(
    cde_id,
    wallet_address,
    balance
) VALUES (
    :cde_id!,
    :wallet_address!,
    :balance!
);

/* @name cdeErc20UpdateBalance */
UPDATE cde_erc20_data
SET
    balance = :balance!
WHERE cde_id = :cde_id!
AND wallet_address = :wallet_address!;