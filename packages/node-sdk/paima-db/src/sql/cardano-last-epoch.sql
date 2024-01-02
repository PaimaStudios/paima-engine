/* @name updateCardanoEpoch */
INSERT INTO cardano_last_epoch(
    id,
    epoch
) VALUES (
    0,
    :epoch!
) 
ON CONFLICT (id) DO
UPDATE SET epoch = :epoch!;

/* @name getCardanoEpoch */
SELECT epoch from cardano_last_epoch LIMIT 1;