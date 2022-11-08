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

/* @name deleteScheduled */
DELETE FROM scheduled_data
WHERE id = :id!;

/* @name findNonce */
SELECT * FROM nonces
WHERE nonce = :nonce;

/* @name insertNonce */
INSERT INTO nonces(nonce, block_height)
VALUES (:nonce!, :block_height!);