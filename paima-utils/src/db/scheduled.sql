/* @name newScheduledData */
INSERT INTO scheduled_data(block_height, input_data)
VALUES (:block_height!, :input_data!);

/* @name getScheduledDataByBlockHeight */
SELECT * from scheduled_data
WHERE block_height = :block_height!
ORDER BY id ASC;

/* @name removeScheduledData */
DELETE FROM scheduled_data
WHERE block_height = :block_height!
AND input_data = :input_data!;