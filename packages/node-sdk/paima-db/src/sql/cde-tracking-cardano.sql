/* @name markCardanoCdeSlotProcessed */
INSERT INTO cde_tracking(block_height)
VALUES (:slot!);

/* @name getCardanoSpecificCdeBlockheight */
SELECT * FROM cde_tracking_cardano
WHERE slot = :slot!;

/* @name getCardanoLatestProcessedCdeBlockheight */
SELECT * FROM cde_tracking_cardano
ORDER BY slot DESC
LIMIT 1;