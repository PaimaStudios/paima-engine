/* @name markCardanoCdeSlotProcessed */
INSERT INTO cde_tracking_cardano(id,slot)
VALUES (0, :slot!)
ON CONFLICT (id)
DO UPDATE SET slot = :slot!;

/* @name getCardanoLatestProcessedCdeSlot */
SELECT slot FROM cde_tracking_cardano LIMIT 1;