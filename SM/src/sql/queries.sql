/* @name getLatestBlockHeight */
SELECT * FROM block_heights 
ORDER BY block_height DESC
LIMIT 1;

/* @name getRandomness */
SELECT seed FROM block_heights
ORDER BY block_height DESC
LIMIT 25;

/* @name getScheduledDataByBlockHeight */
SELECT * from scheduled_data
WHERE block_height = :block_height!
ORDER BY id ASC;

/*  @name saveLastBlockHeight */
INSERT INTO block_heights(block_height, seed)
VALUES (:block_height!, :seed!);

/* @name blockHeightDone */
UPDATE block_heights
SET
done = true
WHERE block_height = :block_height!;