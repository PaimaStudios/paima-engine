/* @name emulatedSelectLatestPrior */
SELECT * FROM emulated_block_heights
WHERE emulated_block_height <= :emulated_block_height!
ORDER BY deployment_chain_block_height DESC
LIMIT 1;

/*
  @name upsertEmulatedBlockheight
  @param items -> ((deployment_chain_block_height, second_timestamp, emulated_block_height)...)
*/
INSERT INTO emulated_block_heights(
    deployment_chain_block_height,
    second_timestamp,
    emulated_block_height
) VALUES :items!
ON CONFLICT DO NOTHING;

/* @name deploymentChainBlockheightToEmulated */
SELECT emulated_block_height FROM emulated_block_heights
WHERE deployment_chain_block_height = :deployment_chain_block_height!;

/* @name emulatedBlockheightToDeploymentChain */
SELECT deployment_chain_block_height FROM emulated_block_heights
WHERE emulated_block_height = :emulated_block_height!;