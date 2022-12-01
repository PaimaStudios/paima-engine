/* @name getLatestBlockHeight */
SELECT * FROM block_heights
WHERE done IS TRUE
ORDER BY block_height DESC
LIMIT 1;

/* @name getBlockSeeds */
SELECT seed FROM block_heights
WHERE done IS TRUE
ORDER BY block_height DESC
LIMIT 25;

/*  @name saveLastBlockHeight */
INSERT INTO block_heights(block_height, seed, done)
VALUES (:block_height!, :seed!, FALSE)
ON CONFLICT (block_height)
DO UPDATE SET
block_height = EXCLUDED.block_height,
seed = EXCLUDED.seed,
done = EXCLUDED.done;

/* @name blockHeightDone */
UPDATE block_heights
SET
done = true
WHERE block_height = :block_height!;

/* @name deleteScheduled */
DELETE FROM scheduled_data
WHERE id = :id!;

/* @name getScheduledDataByBlockHeight */
SELECT * from scheduled_data
WHERE block_height = :block_height!
ORDER BY id ASC;

/* @name findNonce */
SELECT * FROM nonces
WHERE nonce = :nonce;

/* @name deleteNonces */
DELETE FROM nonces
WHERE block_height <= :limit_block_height!;

/* @name insertNonce */
INSERT INTO nonces(nonce, block_height)
VALUES (:nonce!, :block_height!);