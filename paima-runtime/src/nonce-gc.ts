import type { Pool } from 'pg';

import { deleteNonces } from '@paima/db';
import { ENV, doLog } from '@paima/utils';

const BLOCKS_PER_MINUTE = Math.ceil(60 / ENV.BLOCK_TIME);
const NONCE_GC_INTERVAL = 21600; // how often to do GC
const NONCE_GC_LIFETIME = 7 * 24 * 60 * BLOCKS_PER_MINUTE; // minimum age of nonces to be deleted

let nonceGcTrigger: number = ENV.SM_START_BLOCKHEIGHT;

export async function cleanNoncesIfTime(
  DBPool: Pool,
  latestProcessedBlockHeight: number
): Promise<void> {
  if (latestProcessedBlockHeight < nonceGcTrigger) {
    return;
  }
  nonceGcTrigger = Math.max(nonceGcTrigger, latestProcessedBlockHeight) + NONCE_GC_INTERVAL;
  const deletionLimit = latestProcessedBlockHeight - NONCE_GC_LIFETIME;
  const deleteUpTo = deletionLimit > 0 ? deletionLimit : 0;
  try {
    await deleteNonces.run({ limit_block_height: deleteUpTo }, DBPool);
  } catch (err) {
    doLog(`[paima-runtime::nonce-gc] Error while deleting nonces: ${err}`);
  }
}
