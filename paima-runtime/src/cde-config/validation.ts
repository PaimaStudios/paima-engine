import type { Pool } from 'pg';

import { ChainDataExtensionType, doLog } from '@paima/utils';
import type { IGetChainDataExtensionsResult } from '@paima/db';
import {
  getChainDataExtensions,
  getSpecificCdeConfigGeneric,
  getSpecificCdeConfigErc20Deposit,
  registerCdeConfigGeneric,
  registerChainDataExtension,
} from '@paima/db';

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
    if (!(await validateSingleExtensionConfig(cde, persistent, DBConn))) {
      return false;
    }
  }
  return true;
}

async function validateSingleExtensionConfig(
  cde: ChainDataExtension,
  persistent: IGetChainDataExtensionsResult,
  DBConn: Pool
): Promise<boolean> {
  if (
    persistent.cde_type !== cde.cdeType ||
    persistent.cde_name !== cde.cdeName ||
    persistent.contract_address !== cde.contractAddress ||
    persistent.start_blockheight !== cde.startBlockHeight ||
    persistent.scheduled_prefix !== cde.scheduledPrefix
  ) {
    return false;
  }
  switch (cde.cdeType) {
    case ChainDataExtensionType.ERC20Deposit:
      const erc20DepositConfigs = await getSpecificCdeConfigErc20Deposit.run(
        { cde_id: cde.cdeId },
        DBConn
      );
      if (erc20DepositConfigs.length !== 1) {
        return false;
      }
      const erc20DepositConfig = erc20DepositConfigs[0];
      if (erc20DepositConfig.deposit_address !== cde.depositAddress) {
        return false;
      }
      break;
    case ChainDataExtensionType.Generic:
      const genericConfigs = await getSpecificCdeConfigGeneric.run({ cde_id: cde.cdeId }, DBConn);
      if (genericConfigs.length !== 1) {
        return false;
      }
      const genericConfig = genericConfigs[0];
      if (genericConfig.event_signature !== cde.eventSignature) {
        return false;
      }
      if (genericConfig.contract_abi !== cde.rawContractAbi) {
        return false;
      }
      break;
    case ChainDataExtensionType.ERC20:
    case ChainDataExtensionType.ERC721:
    case ChainDataExtensionType.PaimaERC721:
    default:
    // no extra validation necessary for the remaining types
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
          scheduled_prefix: cde.scheduledPrefix,
        },
        DBConn
      );
      switch (cde.cdeType) {
        case ChainDataExtensionType.ERC20Deposit:
          break;
        case ChainDataExtensionType.Generic:
          await registerCdeConfigGeneric.run(
            {
              cde_id: cde.cdeId,
              event_signature: cde.eventSignature,
              contract_abi: cde.rawContractAbi,
            },
            DBConn
          );
          break;
        case ChainDataExtensionType.ERC20:
        case ChainDataExtensionType.ERC721:
        case ChainDataExtensionType.PaimaERC721:
        // no special configuration needed for these CDE types
      }
    }
  } catch (err) {
    doLog(`[storeCdeConfig] error while storing config: ${err}`);
    return false;
  }
  return true;
}
