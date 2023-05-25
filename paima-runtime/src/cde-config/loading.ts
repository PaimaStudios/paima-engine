import * as fs from 'fs/promises';
import YAML from 'yaml';
import type Web3 from 'web3';

import { doLog, getErc165Contract, getPaimaErc721Contract } from '@paima/utils';

import type { ChainDataExtension } from '../types';
import { parseCdeType } from './utils';
import { ChainDataExtensionType, getErc20Contract, getErc721Contract } from '@paima/utils';

interface CdeConfig {
  cdeId: number;
  type: string;
  name: string;
  contractAddress: string;
  startBlockHeight: number;
  initializationPrefix: string;
  depositAddress: string;
}

type CdeBase = Omit<ChainDataExtension, 'cdeType' | 'contract'>;

export async function loadChainDataExtensions(
  web3: Web3,
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
    const config = parseCdeConfigFile(configFileData);
    const instantiatedExtensions = await Promise.all(
      config.map(e => instantiateExtension(e, web3))
    );
    return instantiatedExtensions;
  } catch (err) {
    doLog(`[cde-config] Invalid config file, assuming no CDEs. Error: ${err}`);
    return [];
  }
}

// Validate the overall structure of the config file and extract the relevant data
function parseCdeConfigFile(configFileData: string): CdeConfig[] {
  const configObject = YAML.parse(configFileData);

  if (!configObject.extensions || !Array.isArray(configObject.extensions)) {
    throw new Error(`[cde-config] extensions field missing or invalid`);
  }

  const config = configObject.extensions.map((e: any, i: number) => parseSingleCdeConfig(e, i + 1));

  return config;
}

// Ensure the expected fields exist and are of correct types
function parseSingleCdeConfig(config: any, cdeId: number): CdeConfig {
  if (
    !config ||
    typeof config.type !== 'string' ||
    typeof config.contractAddress != 'string' ||
    typeof config.name !== 'string' ||
    typeof config.startBlockHeight !== 'number'
  ) {
    throw new Error(`[cde-config] invalid config or required field of unexpected type`);
  }

  const { type, contractAddress, name, startBlockHeight } = config;

  const initializationPrefix =
    typeof config.initializationPrefix === 'string' ? config.initializationPrefix : '';

  const depositAddress =
    typeof config.depositAddress === 'string' ? config.depositAddress.toLowerCase() : '';

  return {
    cdeId,
    type,
    name,
    contractAddress,
    startBlockHeight,
    initializationPrefix,
    depositAddress,
  };
}

// Do type-specific initialization and construct contract objects
async function instantiateExtension(config: CdeConfig, web3: Web3): Promise<ChainDataExtension> {
  const cdeType = parseCdeType(config.type);
  const cdeBase: CdeBase = {
    cdeId: config.cdeId,
    cdeName: config.name,
    contractAddress: config.contractAddress,
    startBlockHeight: config.startBlockHeight,
    initializationPrefix: config.initializationPrefix,
    depositAddress: config.depositAddress,
  };

  switch (cdeType) {
    case ChainDataExtensionType.ERC20:
      return {
        ...cdeBase,
        cdeType,
        contract: getErc20Contract(config.contractAddress, web3),
      };
    case ChainDataExtensionType.ERC721:
      if (!config.initializationPrefix) {
        throw new Error('[cde-config] Initialization prefix missing!');
      }
      if (await isPaimaErc721(config, web3)) {
        return {
          ...cdeBase,
          cdeType: ChainDataExtensionType.PaimaERC721,
          contract: getPaimaErc721Contract(config.contractAddress, web3),
        };
      } else {
        return {
          ...cdeBase,
          cdeType,
          contract: getErc721Contract(config.contractAddress, web3),
        };
      }
    case ChainDataExtensionType.ERC20Deposit:
      return {
        ...cdeBase,
        cdeType,
        contract: getErc20Contract(config.contractAddress, web3),
      };
    default:
      throw new Error(`[cde-config] Invalid cde type: ${cdeType}`);
  }
}

async function isPaimaErc721(cdeConfig: CdeConfig, web3: Web3): Promise<boolean> {
  const PAIMA_EXTENDED_MINT_SIGNATURE = 'mint(address,string)';
  const interfaceId = web3.utils.keccak256(PAIMA_EXTENDED_MINT_SIGNATURE).substring(0, 10);
  try {
    const erc165Contract = getErc165Contract(cdeConfig.contractAddress, web3);
    return await erc165Contract.methods.supportsInterface(interfaceId).call();
  } catch (err) {
    doLog(`[cde-config] Error while attempting to specify ERC721 subtype: ${err}`);
    return false;
  }
}
