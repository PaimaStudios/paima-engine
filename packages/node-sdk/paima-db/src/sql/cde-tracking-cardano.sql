/* @name markCardanoCdeDatumProcessed */
INSERT INTO cde_tracking_cardano(slot, datum_count, done)
VALUES (:slot!, :datum_count, FALSE)
ON CONFLICT (slot)
DO UPDATE SET
slot = EXCLUDED.slot,
datum_count = EXCLUDED.datum_count,
done = EXCLUDED.done;

/* @name markCardanoCdeBlockheightProcessed */
UPDATE cde_tracking_cardano
SET
  done = TRUE
WHERE slot = :slot!;

/* @name getCardanoSpecificCdeBlockheight */
SELECT * FROM cde_tracking_cardano
WHERE slot = :slot!;

/* @name getCardanoLatestProcessedCdeBlockheight */
SELECT * FROM cde_tracking_cardano
WHERE done IS TRUE
ORDER BY slot DESC
LIMIT 1;