/* @name updateMinaCheckpoint */
INSERT INTO mina_checkpoint(
    timestamp,
    network
) VALUES (
    :timestamp!,
    :network!
) 
ON CONFLICT (network) DO
UPDATE SET timestamp = :timestamp!;

/* @name getMinaCheckpoint */
SELECT timestamp FROM mina_checkpoint WHERE network = :network! LIMIT 1;
