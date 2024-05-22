/* @name getChainDataExtensions */
SELECT * FROM chain_data_extensions;

/* @name getSpecificChainDataExtension */
SELECT * FROM chain_data_extensions
WHERE cde_name = :cde_name;

/* @name selectChainDataExtensionsByName */
SELECT * FROM chain_data_extensions
WHERE cde_name = :cde_name!;

/* @name registerChainDataExtension */
INSERT INTO
    chain_data_extensions (
        CDE_TYPE,
        CDE_NAME,
        CDE_HASH,
        START_BLOCKHEIGHT,
        SCHEDULED_PREFIX
    )
VALUES (
    :cde_type!,
    :cde_name!,
    :cde_hash!,
    :start_blockheight!,
    :scheduled_prefix
);


/* @name registerDynamicChainDataExtension */
INSERT INTO
    chain_data_extensions (
        CDE_NAME,
        CDE_TYPE,
        START_BLOCKHEIGHT,
        SCHEDULED_PREFIX
    )
SELECT 
    :base_name! || '-' || COUNT(*),
    :cde_type!,
    :start_blockheight!,
    :scheduled_prefix!
FROM
    chain_data_extensions
WHERE starts_with(cde_name, :base_name! || '-');