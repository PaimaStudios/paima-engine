/* @name markCdeBlockheightTouched */
INSERT INTO cde_processing(block_height, done)
VALUES (:block_height!, FALSE)
ON CONFLICT (block_height)
DO UPDATE SET
block_height = EXCLUDED.block_height,
done = EXCLUDED.done;

/* @name markCdeBlockheightProcessed */
INSERT INTO cde_processing(block_height, done)
VALUES (:block_height!, TRUE)
ON CONFLICT (block_height)
DO UPDATE SET
block_height = EXCLUDED.block_height,
done = EXCLUDED.done;

/* @name getLatestProcessedCdeBlockheight */
SELECT * FROM cde_processing
WHERE done IS TRUE
ORDER BY block_height DESC
LIMIT 1;