/* @name cdeErc721GetOwner */
SELECT * FROM cde_erc721_data
WHERE cde_id = :cde_id!
AND token_id = :token_id!;

/* @name cdeErc721GetOwnedNfts */
SELECT * FROM cde_erc721_data
WHERE cde_id = :cde_id!
AND nft_owner = :nft_owner!;

/* @name cdeErc721InsertOwner */
INSERT INTO cde_erc721_data(
    cde_id,
    token_id,
    nft_owner
) VALUES (
    :cde_id!,
    :token_id!,
    :nft_owner!
);

/* @name cdeErc721UpdateOwner */
UPDATE cde_erc721_data
SET
    nft_owner = :nft_owner!
WHERE cde_id = :cde_id!
AND token_id = :token_id!;

/* @name cdeErc721GetAllOwnedNfts */
SELECT cde_name, token_id  FROM cde_erc721_data
JOIN chain_data_extensions ON chain_data_extensions.cde_id = cde_erc721_data.cde_id
WHERE nft_owner = :nft_owner!;


/* @name cdeErc721Delete */
DELETE FROM cde_erc721_data
WHERE cde_id = :cde_id!
AND token_id = :token_id!;

/* @name cdeErc721BurnInsert */
INSERT INTO cde_erc721_burn(
    cde_id,
    token_id,
    nft_owner
) VALUES (
    :cde_id!,
    :token_id!,
    :nft_owner!
);