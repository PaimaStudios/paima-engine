import type { Pool } from 'pg';

import type { ChainDataExtension } from '@paima/utils';
import { doLog } from '@paima/utils';
import { getChainDataExtensions, registerChainDataExtension } from '@paima/db';

export async function validatePersistentCdeConfig(
  config: ChainDataExtension[],
  DBConn: Pool,
  smStarted: boolean
): Promise<boolean> {
  const persistentConfig = await getChainDataExtensions.run(undefined, DBConn);
  if (persistentConfig.length === 0) {
    if (smStarted) {
      return false;
    }

    return await storeCdeConfig(config, DBConn);
  }

  if (persistentConfig.length !== config.length) {
    return false;
  }

  for (const cde of config) {
    const persistent = persistentConfig.find(row => row.cde_id === cde.cdeId);
    if (!persistent) {
      return false;
    }
    if (
      persistent.cde_type !== cde.cdeType ||
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
          contract_address: cde.contractAddress,
          start_blockheight: cde.startBlockHeight,
          scheduled_prefix: cde.initializationPrefix,
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
