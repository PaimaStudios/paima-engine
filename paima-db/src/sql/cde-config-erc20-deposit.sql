/* @name getCdeConfigErc20Deposit */
SELECT * FROM cde_config_erc20_deposit;

/* @name getSpecificCdeConfigErc20Deposit */
SELECT * FROM cde_config_erc20_deposit
WHERE cde_id = :cde_id;

/* @name registerCdeConfigErc20Deposit */
INSERT INTO cde_config_erc20_deposit(
    cde_id,
    deposit_address
) VALUES (
    :cde_id!,
    :deposit_address!
);