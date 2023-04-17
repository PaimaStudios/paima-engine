/* @name getChainDataExtensions */
SELECT * FROM chain_data_extensions;

/* @name getSpecificChainDataExtension */
SELECT * FROM chain_data_extensions
WHERE cde_id = :cde_id;

/* @name selectChainDataExtensionsByName */
SELECT * FROM chain_data_extensions
WHERE cde_name = :cde_name!;

/* @name selectChainDataExtensionsByTypeAndAddress */
SELECT * FROM chain_data_extensions
WHERE cde_type = :cde_type!
AND contract_address = :contract_address!;

/* @name selectChainDataExtensionsByAddress */
SELECT * FROM chain_data_extensions
WHERE contract_address = :contract_address!;

/* @name registerChainDataExtension */
INSERT INTO chain_data_extensions(
    cde_id,
    cde_type,
    cde_name,
    contract_address,
    start_blockheight,
    scheduled_prefix
) VALUES (
    :cde_id!,
    :cde_type!,
    :cde_name!,
    :contract_address!,
    :start_blockheight!,
    :scheduled_prefix
);