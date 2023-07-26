/* @name emulatedSelectLatestPrior */
SELECT * FROM emulated_block_heights
WHERE emulated_block_height <= :emulated_block_height!
ORDER BY deployment_chain_block_height DESC
LIMIT 1;

/* @name emulatedStoreBlockHeight */
INSERT INTO emulated_block_heights(
    deployment_chain_block_height,
    second_timestamp,
    emulated_block_height
) VALUES (
    :deployment_chain_block_height!,
    :second_timestamp!,
    :emulated_block_height!
) ON CONFLICT (deployment_chain_block_height)
DO UPDATE SET
deployment_chain_block_height = EXCLUDED.deployment_chain_block_height,
second_timestamp = EXCLUDED.second_timestamp,
emulated_block_height = EXCLUDED.emulated_block_height;
