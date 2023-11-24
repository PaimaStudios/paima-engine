/* @name markCardanoCdeSlotProcessed */
INSERT INTO cde_tracking_cardano(slot)
VALUES (:slot!);

/* @name getCardanoSpecificCdeBlockheight */
SELECT * FROM cde_tracking_cardano
WHERE slot = :slot!;

/* @name getCardanoLatestProcessedCdeBlockheight */
SELECT * FROM cde_tracking_cardano
ORDER BY slot DESC
LIMIT 1;