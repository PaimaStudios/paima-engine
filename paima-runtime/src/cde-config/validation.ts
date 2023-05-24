import type { Pool } from 'pg';

import { doLog } from '@paima/utils';
import { getChainDataExtensions, registerChainDataExtension } from '@paima/db';

import type { ChainDataExtension } from '../types';

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
    return await storeCdeConfig(config, DBConn);
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
    if (
      persistent.cde_type !== cde.cdeType ||
      persistent.cde_name !== cde.cdeName ||
      persistent.contract_address !== cde.contractAddress ||
      persistent.start_blockheight !== cde.startBlockHeight
    ) {
      return false;
    }
  }
  return true;
}

async function storeCdeConfig(config: ChainDataExtension[], DBConn: Pool): Promise<boolean> {
  try {
    for (const cde of config) {
      await registerChainDataExtension.run(
        {
          cde_id: cde.cdeId,
          cde_type: cde.cdeType,
          cde_name: cde.cdeName,
          contract_address: cde.contractAddress,
          start_blockheight: cde.startBlockHeight,
          scheduled_prefix: cde.initializationPrefix,
          deposit_address: cde.depositAddress,
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
