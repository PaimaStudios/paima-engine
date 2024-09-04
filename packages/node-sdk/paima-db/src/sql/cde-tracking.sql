/* @name markCdeBlockheightProcessed */
INSERT INTO cde_tracking(block_height, caip2)
VALUES (:block_height!, :caip2!);

/* @name getLatestProcessedCdeBlockheight */
SELECT block_height FROM cde_tracking
WHERE caip2 = :caip2!
ORDER BY block_height DESC
LIMIT 1;