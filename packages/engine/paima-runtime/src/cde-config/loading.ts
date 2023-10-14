import * as fs from 'fs/promises';
import YAML from 'yaml';
import type Web3 from 'web3';
import type { Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

import type { AbiItem } from '@paima/utils';
import {
  doLog,
  ChainDataExtensionType,
  getErc20Contract,
  getErc721Contract,
  getErc165Contract,
  getPaimaErc721Contract,
  getAbiContract,
  getErc6551RegistryContract,
} from '@paima/utils';

import type {
  ChainDataExtension,
  ChainDataExtensionGeneric,
  TChainDataExtensionErc721Config,
  TChainDataExtensionGenericConfig,
} from '../types';
import { CdeConfig, CdeEntryTypeName } from '../types';
import { loadAbi } from './utils';
import assertNever from 'assert-never';

/** Default registry address specified in ERC6551 */
const ERC6551_REGISTRY_DEFAULT = '0x02101dfB77FDE026414827Fdc604ddAF224F0921';

// Returns [extensions, extensionsValid: boolean]
export async function loadChainDataExtensions(
  web3: Web3,
  configFilePath: string
): Promise<[ChainDataExtension[], boolean]> {
  let configFileData: string;
  try {
    configFileData = await fs.readFile(configFilePath, 'utf8');
  } catch (err) {
    doLog(`[cde-config] config file not found: ${configFilePath}, assuming no CDEs.`);
    return [[], true];
  }

  try {
    const config = parseCdeConfigFile(configFileData);
    const instantiatedExtensions = await Promise.all(
      config.extensions.map((e, i) => instantiateExtension(e, i, web3))
    );
    return [instantiatedExtensions, true];
  } catch (err) {
    doLog(`[cde-config] Invalid config file: ${err}`);
    return [[], false];
  }
}

// Validate the overall structure of the config file and extract the relevant data
function parseCdeConfigFile(configFileData: string): Static<typeof CdeConfig> {
  // Parse the YAML content into an object
  const configObject = YAML.parse(configFileData);

  // Validate the YAML object against the schema
  const validationResult = Value.Check(CdeConfig, configObject);

  if (!validationResult) {
    throw new Error(`[cde-config] extensions field missing or invalid`);
  }

  return configObject;
}

// Do type-specific initialization and construct contract objects
async function instantiateExtension(
  config: Static<typeof CdeConfig>['extensions'][0],
  index: number,
  web3: Web3
): Promise<ChainDataExtension> {
  switch (config.type) {
    case CdeEntryTypeName.ERC20:
      return {
        ...config,
        cdeId: index,
        cdeType: ChainDataExtensionType.ERC20,
        contract: getErc20Contract(config.contractAddress, web3),
      };
    case CdeEntryTypeName.ERC721:
      if (await isPaimaErc721(config, web3)) {
        return {
          ...config,
          cdeId: index,
          cdeType: ChainDataExtensionType.PaimaERC721,
          contract: getPaimaErc721Contract(config.contractAddress, web3),
        };
      } else {
        return {
          ...config,
          cdeId: index,
          cdeType: ChainDataExtensionType.ERC721,
          contract: getErc721Contract(config.contractAddress, web3),
        };
      }
    case CdeEntryTypeName.ERC20Deposit:
      return {
        ...config,
        cdeId: index,
        cdeType: ChainDataExtensionType.ERC20Deposit,
        contract: getErc20Contract(config.contractAddress, web3),
      };
    case CdeEntryTypeName.Generic:
      return await instantiateCdeGeneric(config, index, web3);
    case CdeEntryTypeName.ERC6551Registry:
      const contractAddress = config.contractAddress ?? ERC6551_REGISTRY_DEFAULT;
      return {
        ...config,
        cdeId: index,
        cdeType: ChainDataExtensionType.ERC6551Registry,
        contractAddress,
        contract: getErc6551RegistryContract(contractAddress, web3),
      };
    default:
      assertNever(config);
  }
}

async function isPaimaErc721(
  cdeConfig: TChainDataExtensionErc721Config,
  web3: Web3
): Promise<boolean> {
  const PAIMA_EXTENDED_MINT_SIGNATURE = 'mint(address,string)';
  const interfaceId = web3.utils.keccak256(PAIMA_EXTENDED_MINT_SIGNATURE).substring(0, 10);
  try {
    const erc165Contract = getErc165Contract(cdeConfig.contractAddress, web3);
    return await erc165Contract.methods.supportsInterface(interfaceId).call();
  } catch (err) {
    doLog(`[cde-config] ${cdeConfig.contractAddress} is probably not PaimaERC721: ${err}`);
    return false;
  }
}

async function instantiateCdeGeneric(
  config: TChainDataExtensionGenericConfig,
  index: number,
  web3: Web3
): Promise<ChainDataExtensionGeneric> {
  const eventSignature = config.eventSignature;
  const eventMatch = eventSignature.match(/^[A-Za-z0-9_]+/);
  if (!eventMatch) {
    throw new Error('[cde-config] Event signature invalid!');
  }
  const eventName = eventMatch[0];
  const eventSignatureHash = web3.utils.keccak256(eventSignature);

  const [rawContractAbi, parsedContractAbi] = await loadAbi(config.abiPath);
  if (parsedContractAbi.length === 0) {
    throw new Error(`[cde-config] Invalid ABI file at ${config.abiPath}`);
  }
  try {
    const contract = getAbiContract(config.contractAddress, parsedContractAbi as AbiItem[], web3);
    const { abiPath: _, ...rest } = config; // want to remove abi path since it's no longer relevant at runtime
    return {
      ...rest,
      cdeId: index,
      cdeType: ChainDataExtensionType.Generic,
      contract,
      eventSignature,
      eventName,
      eventSignatureHash,
      rawContractAbi,
    };
  } catch (err) {
    doLog(`[cde-config]: Invalid ABI file at ${config.abiPath}`);
    throw err;
  }
}
