/* @name getDynamicExtensions */
SELECT * FROM cde_dynamic_primitive_config;

/* @name  insertDynamicExtension */
INSERT INTO cde_dynamic_primitive_config(
    cde_name,
    config
) 
SELECT 
    :base_name! || '-' || COUNT(*),
    :config!
FROM
    cde_dynamic_primitive_config
WHERE starts_with(cde_name, :base_name! || '-');
