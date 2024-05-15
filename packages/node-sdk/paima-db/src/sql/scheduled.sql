/* @name newScheduledData */
WITH new_row AS (
  INSERT INTO scheduled_data(block_height, input_data)
  VALUES (:block_height!, :input_data!)
  RETURNING id
)
INSERT INTO scheduled_data_tx_hash(id, tx_hash)
SELECT (SELECT id FROM new_row), :tx_hash::TEXT
WHERE :tx_hash IS NOT NULL;

/* @name getScheduledDataByBlockHeight */
SELECT scheduled_data.id, block_height, input_data, tx_hash
FROM scheduled_data
LEFT JOIN scheduled_data_tx_hash
ON scheduled_data.id = scheduled_data_tx_hash.id
WHERE block_height = :block_height!
ORDER BY scheduled_data.id ASC;

/* @name removeScheduledData */
DELETE FROM scheduled_data
WHERE block_height = :block_height!
AND input_data = :input_data!;

/* @name removeAllScheduledDataByInputData */
DELETE FROM scheduled_data
WHERE input_data = :input_data!;

/* @name deleteScheduled */
DELETE FROM scheduled_data
WHERE id = :id!;
