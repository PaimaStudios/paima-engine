/* @name getChainDataExtensions */
SELECT * FROM chain_data_extensions;

/* @name getSpecificChainDataExtension */
SELECT * FROM chain_data_extensions
WHERE cde_id = :cde_id;

/* @name registerChainDataExtension */
INSERT INTO chain_data_extensions(
    cde_id,
    cde_type,
    contract_address,
    start_blockheight,
    scheduled_prefix
) VALUES (
    :cde_id!,
    :cde_type!,
    :contract_address!,
    :start_blockheight!,
    :scheduled_prefix
);