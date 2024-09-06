/* @name updateMidnightCheckpoint */
INSERT INTO midnight_checkpoint(
    caip2,
    timestamp
) VALUES (
    :caip2!,
    :timestamp!
)
ON CONFLICT (caip2) DO
UPDATE SET timestamp = :timestamp!;

/* @name getMidnightCheckpoint */
SELECT timestamp FROM midnight_checkpoint WHERE caip2 = :caip2! LIMIT 1;
