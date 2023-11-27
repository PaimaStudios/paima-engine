/* @name cdeCardanoGetProjectedNft */
SELECT * FROM cde_cardano_projected_nft
WHERE address = :address!;

/* @name cdeCardanoProjectedNftInsertData */
INSERT INTO cde_cardano_pool_delegation(
    cde_id,
    address,
    asset,
    amount,
    status,
    datum,
) VALUES (
             :cde_id!,
             :address!,
             :asset!
             :amount!
             :status!
             :datum!
         ) ON CONFLICT (cde_id, address) DO
UPDATE SET pool = :pool!;

cde_id: cdeId,
                address: cdeDatum.payload.address,
                asset: cdeDatum.payload.asset,
                amount: cdeDatum.payload.amount,
                status: cdeDatum.payload.status,
                datum: cdeDatum.payload.plutusDatum