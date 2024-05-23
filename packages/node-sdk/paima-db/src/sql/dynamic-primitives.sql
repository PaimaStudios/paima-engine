/* @name getDynamicExtensions */
SELECT * FROM cde_dynamic_primitive_config;

/* @name getDynamicExtensionsByParent */
SELECT * FROM cde_dynamic_primitive_config
WHERE parent = :parent!;

/* @name  insertDynamicExtension */
INSERT INTO cde_dynamic_primitive_config(
    cde_name,
    parent,
    config
) 
SELECT 
    :base_name! || COUNT(*),
    :parent_name!,
    :config!
FROM
    cde_dynamic_primitive_config
WHERE starts_with(cde_name, :base_name!);
