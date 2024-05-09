/* @name getDynamicExtensions */
SELECT * FROM cde_dynamic_primitive_config;

/* @name  insertDynamicExtension */
INSERT INTO cde_dynamic_primitive_config(
    cde_id,
    config
) VALUES (
    :cde_id!,
    :config!
);
