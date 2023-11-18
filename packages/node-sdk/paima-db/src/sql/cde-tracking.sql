/* @name markCdeBlockheightProcessed */
INSERT INTO cde_tracking(block_height)
VALUES (:block_height!);

/* @name getLatestProcessedCdeBlockheight */
SELECT * FROM cde_tracking
ORDER BY block_height DESC
LIMIT 1;