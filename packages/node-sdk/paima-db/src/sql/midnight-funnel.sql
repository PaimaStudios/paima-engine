/* @name updateMidnightCheckpoint */
INSERT INTO midnight_checkpoint(
    caip2,
    block_height
) VALUES (
    :caip2!,
    :block_height!
)
ON CONFLICT (caip2) DO
UPDATE SET block_height = :block_height!;

/* @name getMidnightCheckpoint */
SELECT block_height FROM midnight_checkpoint WHERE caip2 = :caip2! LIMIT 1;
