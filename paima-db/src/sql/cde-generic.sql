/* @name cdeGenericGetAllData */
SELECT * FROM cde_generic_data
WHERE cde_id = :cde_id!;

/* @name cdeGenericGetBlockheightData */
SELECT * FROM cde_generic_data
WHERE cde_id = :cde_id!
AND block_height = :block_height!;

/* @name cdeGenericGetRangeData */
SELECT * FROM cde_generic_data
WHERE cde_id = :cde_id!
AND block_height >= :from_block!
AND block_height <= :to_block!;

/* @name cdeGenericInsertData */
INSERT INTO cde_generic_data(
    cde_id,
    block_height,
    event_data
) VALUES (
    :cde_id!,
    :block_height!,
    :event_data!
);