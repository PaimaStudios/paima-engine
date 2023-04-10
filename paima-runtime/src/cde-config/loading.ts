import * as fs from 'fs/promises';
import YAML from 'yaml';

import { doLog } from '@paima/utils';

import type { ChainDataExtension } from '../types';
import { parseCdeType } from './utils';

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
