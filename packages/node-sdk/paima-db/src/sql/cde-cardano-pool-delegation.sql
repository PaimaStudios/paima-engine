/* @name cdeCardanoPoolGetAddressDelegation */
SELECT * FROM cde_cardano_pool_delegation 
WHERE address = :address!;

/* @name cdeCardanoPoolInsertData */
INSERT INTO cde_cardano_pool_delegation(
    cde_id,
    address,
    pool
) VALUES (
    :cde_id!,
    :address!,
    :pool!
) ON CONFLICT (cde_id, address) DO
  UPDATE SET pool = :pool!;