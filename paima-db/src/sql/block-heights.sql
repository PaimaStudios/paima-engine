/* @name getLatestProcessedBlockHeight */
SELECT * FROM block_heights
WHERE done IS TRUE
ORDER BY block_height DESC
LIMIT 1;

/* @name getBlockSeeds */
SELECT seed FROM block_heights
WHERE done IS TRUE
ORDER BY block_height DESC
LIMIT 25;

/* @name getBlockHeight */
SELECT * FROM block_heights 
WHERE block_height = :block_height;

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