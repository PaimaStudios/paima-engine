/* @name cdeErc6551GetOwner */
SELECT * FROM cde_erc6551_registry_data
WHERE cde_name = :cde_name!
AND account_created = :account_created!;

/* @name cdeErc6551GetOwnedAccounts */
SELECT * FROM cde_erc6551_registry_data
WHERE cde_name = :cde_name!
AND token_contract = :token_contract!
AND token_id = :token_id!;

/* @name cdeErc6551InsertRegistry */
INSERT INTO cde_erc6551_registry_data(
    cde_name,
    block_height,
    account_created,
    implementation,
    token_contract,
    token_id,
    chain_id,
    salt
) VALUES (
    :cde_name!,
    :block_height!,
    :account_created!,
    :implementation!,
    :token_contract!,
    :token_id!,
    :chain_id!,
    :salt!
);
