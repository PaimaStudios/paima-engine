/* @name markPresyncBlockheightTouched */
INSERT INTO presync_block_heights(block_height, done)
VALUES (:block_height!, FALSE)
ON CONFLICT (block_height)
DO UPDATE SET
block_height = EXCLUDED.block_height,
done = EXCLUDED.done;

/* @name markPresyncBlockheightProcessed */
INSERT INTO presync_block_heights(block_height, done)
VALUES (:block_height!, TRUE)
ON CONFLICT (block_height)
DO UPDATE SET
block_height = EXCLUDED.block_height,
done = EXCLUDED.done;

/* @name getLatestProcessedPresyncBlockheight */
SELECT * FROM presync_block_heights
WHERE done IS TRUE
ORDER BY block_height DESC
LIMIT 1;