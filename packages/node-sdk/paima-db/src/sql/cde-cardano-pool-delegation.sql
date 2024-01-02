/* @name cdeCardanoPoolGetAddressDelegation */
SELECT * FROM cde_cardano_pool_delegation 
WHERE address = :address!
ORDER BY epoch;

/* @name cdeCardanoPoolInsertData */
INSERT INTO cde_cardano_pool_delegation(
    cde_id,
    address,
    pool,
    epoch
) VALUES (
    :cde_id!,
    :address!,
    :pool!,
    :epoch!
) ON CONFLICT (cde_id, epoch, address) DO
  UPDATE SET pool = :pool!;


/* @name removeOldEntries */
DELETE FROM cde_cardano_pool_delegation
WHERE (cde_id, epoch, address) NOT IN (
    SELECT
        cde_id, epoch, address
    FROM cde_cardano_pool_delegation
    WHERE address = :address!
    ORDER BY epoch DESC
	LIMIT 2
)
AND address = :address!;