/* @name getChainDataExtensions */
SELECT * FROM chain_data_extensions;

/* @name registerChainDataExtension */
INSERT INTO chain_data_extensions(
    cde_id,
    cde_type,
    contract_address,
    start_blockheight
) VALUES (
    :cde_id!,
    :cde_type!,
    :contract_address!,
    :start_blockheight!
);