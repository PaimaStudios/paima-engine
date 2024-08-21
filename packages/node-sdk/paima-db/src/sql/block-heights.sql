/* @name getLatestProcessedBlockHeight */
SELECT * FROM paima_blocks
WHERE paima_block_hash IS NOT NULL
ORDER BY block_height DESC
LIMIT 1;

/* @name getBlockSeeds */
SELECT seed FROM paima_blocks
WHERE paima_block_hash IS NOT NULL
ORDER BY block_height DESC
LIMIT 25;

/*
 @name getBlockHeights
 @param block_heights -> (...)
*/
SELECT * FROM paima_blocks 
WHERE block_height IN :block_heights!
ORDER BY block_height ASC;

/*  @name saveLastBlock */
INSERT INTO paima_blocks(block_height, ver, main_chain_block_hash, seed, ms_timestamp, paima_block_hash)
VALUES (:block_height!, :ver!, :main_chain_block_hash!, :seed!, :ms_timestamp!, NULL)
ON CONFLICT (block_height)
DO UPDATE SET
block_height = EXCLUDED.block_height,
ver = EXCLUDED.ver,
main_chain_block_hash = EXCLUDED.main_chain_block_hash,
seed = EXCLUDED.seed,
ms_timestamp = EXCLUDED.ms_timestamp,
paima_block_hash = EXCLUDED.paima_block_hash;

/* @name blockHeightDone */
UPDATE paima_blocks
SET
paima_block_hash = :block_hash!
WHERE block_height = :block_height!;
