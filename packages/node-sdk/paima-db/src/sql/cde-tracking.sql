/* @name markCdeBlockheightProcessed */
INSERT INTO cde_tracking(block_height, network)
VALUES (:block_height!, :network!);

/* @name getLatestProcessedCdeBlockheight */
SELECT block_height FROM cde_tracking
WHERE network = :network!
ORDER BY block_height DESC
LIMIT 1;