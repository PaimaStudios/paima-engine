/* @name getDynamicExtensions */
SELECT * FROM cde_dynamic_primitive_config;

/* @name  insertDynamicExtension */
INSERT INTO cde_dynamic_primitive_config(
    cde_id,
    config
) 
SELECT 
    MAX(chain_data_extensions.cde_id),
    :config!
FROM
    chain_data_extensions;
