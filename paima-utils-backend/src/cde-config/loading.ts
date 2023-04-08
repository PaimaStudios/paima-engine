import * as fs from 'fs/promises';
import YAML from 'yaml';

import { ChainDataExtensionType, doLog } from '@paima/utils';
import type { ChainDataExtension } from '@paima/utils';
import { parseCdeType } from './utils';

const HARDCODED_CDE_DJED_SC: ChainDataExtension = {
  cdeId: 1,
  cdeType: ChainDataExtensionType.ERC20,
  contractAddress: '0x69cD594C6dC452A098dCebac0eF57f445247a022',
  startBlockHeight: 4502749,
  initializationPrefix: '',
};

const HARDCODED_CDE_DJED_RC: ChainDataExtension = {
  cdeId: 2,
  cdeType: ChainDataExtensionType.ERC20,
  contractAddress: '0x35963af2fA1E6cBf984369B69eCf24c0F1B671B2',
  startBlockHeight: 4502749,
  initializationPrefix: '',
};

const HARCDODED_CDE_NFT: ChainDataExtension = {
  cdeId: 3,
  cdeType: ChainDataExtensionType.ERC721,
  contractAddress: '0x28d7430845044EB1A9Fc50aD7A605686CFb784DB',
  startBlockHeight: 6228242,
  initializationPrefix: '',
};

export async function loadChainDataExtensions(
  configFilePath: string
): Promise<ChainDataExtension[]> {
  let configFileData: string;
  try {
    configFileData = await fs.readFile(configFilePath, 'utf8');
  } catch (err) {
    doLog(`[cde-config] config file not found: ${configFilePath}, assuming no CDEs.`);
    return [];
  }

  try {
    const configObject = YAML.parse(configFileData);

    if (!configObject.extensions || !Array.isArray(configObject.extensions)) {
      throw new Error(`[cde-config] extensions field missing or invalid`);
    }

    const config = configObject.extensions.map((e: any, i: number) => processCdeConfig(e, i + 1));

    return config;
  } catch (err) {
    doLog(`[cde-config] Invalid config file, assuming no CDEs. Error: ${err}`);
    return [];
  }
}

function processCdeConfig(extension: any, cdeId: number): ChainDataExtension {
  if (
    !extension ||
    !extension.type ||
    !extension.contractAddress ||
    typeof extension.type !== 'string' ||
    typeof extension.contractAddress != 'string'
  ) {
    throw new Error('[cde-config] Invalid extension entry');
  }

  const cdeBase = {
    cdeId,
    cdeType: parseCdeType(extension.type as string),
    contractAddress: extension.contractAddress,
    startBlockHeight: 0,
    initializationPrefix: '',
  };

  if (extension.startBlockHeight) {
    cdeBase.startBlockHeight = extension.startBlockHeight;
  }

  if (extension.initializationPrefix) {
    cdeBase.initializationPrefix = extension.initializationPrefix;
  }

  return cdeBase;
}
