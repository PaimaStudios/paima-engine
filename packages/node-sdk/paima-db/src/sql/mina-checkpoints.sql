/* @name updateMinaCheckpoint */
INSERT INTO mina_checkpoint(
    timestamp,
    caip2
) VALUES (
    :timestamp!,
    :caip2!
) 
ON CONFLICT (caip2) DO
UPDATE SET timestamp = :timestamp!;

/* @name getMinaCheckpoint */
SELECT timestamp FROM mina_checkpoint WHERE caip2 = :caip2! LIMIT 1;
