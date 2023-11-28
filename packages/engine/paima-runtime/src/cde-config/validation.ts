import type { PoolClient, Pool } from 'pg';

import { doLog } from '@paima/utils';
import { tx, getChainDataExtensions, registerChainDataExtension } from '@paima/db';

import type { ChainDataExtension } from '@paima/sm';

/**
 * Check that the configuration used when syncing the game node still matches their current value
 * Otherwise, the game node will have to be re-synced from scratch
 */
export async function validatePersistentCdeConfig(
  config: ChainDataExtension[],
  DBConn: Pool,
  smStarted: boolean
): Promise<boolean> {
  const persistentConfig = await getChainDataExtensions.run(undefined, DBConn);

  // Checking cases if config is specified and if it needs to be saved
  if (persistentConfig.length === 0 && config.length > 0) {
    // If the node has already started syncing with no persistent config but now has a filled out yaml config
    if (smStarted) {
      return false;
    }
    // Else if it hasn't started syncing yet, store the yaml config
    return await tx<boolean>(DBConn, async dbTx => await storeCdeConfig(config, dbTx));
  }

  // If the configs aren't equal in length
  if (persistentConfig.length !== config.length) {
    return false;
  }

  // Verifying all CDEs match between persistent config and read yaml config
  for (const cde of config) {
    const persistent = persistentConfig.find(row => row.cde_id === cde.cdeId);
    if (!persistent) {
      return false;
    }
    if (persistent.cde_hash !== cde.hash) {
      return false;
    }
  }
  return true;
}

/**
 * Store all fields that should force a resync if they change
 */
async function storeCdeConfig(config: ChainDataExtension[], DBConn: PoolClient): Promise<boolean> {
  try {
    for (const cde of config) {
      await registerChainDataExtension.run(
        {
          cde_id: cde.cdeId,
          cde_type: cde.cdeType,
          cde_name: cde.name,
          cde_hash: cde.hash,
          start_blockheight: cde.startBlockHeight,
          scheduled_prefix: 'scheduledPrefix' in cde ? cde.scheduledPrefix : '',
        },
        DBConn
      );
    }
  } catch (err) {
    doLog(`[storeCdeConfig] error while storing config: ${err}`);
    return false;
  }
  return true;
}
