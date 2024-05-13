/* @name getChainDataExtensions */
SELECT * FROM chain_data_extensions;

/* @name getSpecificChainDataExtension */
SELECT * FROM chain_data_extensions
WHERE cde_id = :cde_id;

/* @name selectChainDataExtensionsByName */
SELECT * FROM chain_data_extensions
WHERE cde_name = :cde_name!;

/* @name registerChainDataExtension */
INSERT INTO
    chain_data_extensions (
        CDE_ID,
        CDE_TYPE,
        CDE_NAME,
        CDE_HASH,
        START_BLOCKHEIGHT,
        SCHEDULED_PREFIX
    )
SELECT
    COALESCE(:cde_id, MAX(chain_data_extensions.cde_id) + 1),
    :cde_type!,
    :cde_name!,
    :cde_hash!,
    :start_blockheight!,
    :scheduled_prefix
FROM
    chain_data_extensions;
