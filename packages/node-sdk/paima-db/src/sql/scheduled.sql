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
SELECT * from scheduled_data
WHERE block_height = :block_height!
ORDER BY id ASC;

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
