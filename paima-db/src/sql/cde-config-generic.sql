/* @name getCdeConfigGeneric */
SELECT * FROM cde_config_generic;

/* @name getSpecificCdeConfigGeneric */
SELECT * FROM cde_config_generic
WHERE cde_id = :cde_id;

/* @name registerCdeConfigGeneric */
INSERT INTO cde_config_generic(
    cde_id,
    event_signature,
    contract_abi
) VALUES (
    :cde_id!,
    :event_signature!,
    :contract_abi!
);