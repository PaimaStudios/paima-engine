/* @name markCdeDatumProcessed */
INSERT INTO cde_tracking(block_height, datum_count, done)
VALUES (:block_height!, :datum_count, FALSE)
ON CONFLICT (block_height)
DO UPDATE SET
block_height = EXCLUDED.block_height,
datum_count = EXCLUDED.datum_count,
done = EXCLUDED.done;

/* @name markCdeBlockheightProcessed */
UPDATE cde_tracking
SET
  done = TRUE
WHERE block_height = :block_height!;

/* @name getSpecificCdeBlockheight */
SELECT * FROM cde_tracking
WHERE block_height = :block_height!;

/* @name getLatestProcessedCdeBlockheight */
SELECT * FROM cde_tracking
WHERE done IS TRUE
ORDER BY block_height DESC
LIMIT 1;