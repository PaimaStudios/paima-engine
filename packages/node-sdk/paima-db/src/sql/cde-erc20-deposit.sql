/* @name cdeErc20DepositGetTotalDeposited */
SELECT * FROM cde_erc20_deposit_data
WHERE cde_name = :cde_name!
AND wallet_address = :wallet_address!;

/* @name cdeErc20DepositInsertTotalDeposited */
INSERT INTO cde_erc20_deposit_data(
    cde_name,
    wallet_address,
    total_deposited
) VALUES (
    :cde_name!,
    :wallet_address!,
    :total_deposited!
);

/* @name cdeErc20DepositUpdateTotalDeposited */
UPDATE cde_erc20_deposit_data
SET
    total_deposited = :total_deposited!
WHERE cde_name = :cde_name!
AND wallet_address = :wallet_address!;

/* @name cdeErc20DepositSelectAll */
SELECT * FROM cde_erc20_deposit_data
WHERE cde_name = :cde_name!;