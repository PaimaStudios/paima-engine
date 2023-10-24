import * as fs from 'fs/promises';
import YAML from 'yaml';
import type Web3 from 'web3';
import type { Static, TSchema } from '@sinclair/typebox';
import { Value, ValueErrorType } from '@sinclair/typebox/value';

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
  getOldErc6551RegistryContract,
  ERC6551_REGISTRY_DEFAULT,
} from '@paima/utils';

import type {
  ChainDataExtension,
  ChainDataExtensionErc6551Registry,
  ChainDataExtensionGeneric,
  TChainDataExtensionErc721Config,
  TChainDataExtensionGenericConfig,
} from '../types';
import {
  CdeBaseConfig,
  CdeEntryTypeName,
  ChainDataExtensionErc20Config,
  ChainDataExtensionErc20DepositConfig,
  ChainDataExtensionErc6551RegistryConfig,
  ChainDataExtensionErc721Config,
  ChainDataExtensionGenericConfig,
} from '../types';
import type { CdeConfig } from '../types';
import { loadAbi } from './utils';
import assertNever from 'assert-never';
import fnv from 'fnv-plus';
import stableStringify from 'json-stable-stringify';

type ValidationResult = [config: ChainDataExtension[], validated: boolean];

export async function loadChainDataExtensions(
  web3: Web3,
  configFilePath: string
): Promise<ValidationResult> {
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
export function parseCdeConfigFile(configFileData: string): Static<typeof CdeConfig> {
  // Parse the YAML content into an object
  const configObject = YAML.parse(configFileData);

  // Validate the YAML object against the schema
  const baseConfig = checkOrError(undefined, CdeBaseConfig, configObject);

  const checkedConfig = baseConfig.extensions.map(entry => {
    switch (entry.type) {
      case CdeEntryTypeName.ERC20:
        return checkOrError(entry.name, ChainDataExtensionErc20Config, entry);
      case CdeEntryTypeName.ERC721:
        return checkOrError(entry.name, ChainDataExtensionErc721Config, entry);
      case CdeEntryTypeName.ERC20Deposit:
        return checkOrError(entry.name, ChainDataExtensionErc20DepositConfig, entry);
      case CdeEntryTypeName.Generic:
        return checkOrError(entry.name, ChainDataExtensionGenericConfig, entry);
      case CdeEntryTypeName.ERC6551Registry:
        return checkOrError(entry.name, ChainDataExtensionErc6551RegistryConfig, entry);
      default:
        assertNever(entry.type);
    }
  });

  return { extensions: checkedConfig };
}

function checkOrError<T extends TSchema>(
  name: undefined | string,
  structure: T,
  config: unknown
): Static<T> {
  // 1) Check if there are any errors since Value.Decode doesn't give error messages
  {
    const skippableErrors: ValueErrorType[] = [ValueErrorType.Intersect, ValueErrorType.Union];

    const errors = Array.from(Value.Errors(structure, config));
    for (const error of errors) {
      // there are many useless errors in this library
      // ex: 1st error: "foo" should be "bar" in struct Foo
      //     2nd error: struct Foo is invalid inside struct Config
      //     in this case, the 2nd error is useless as we only care about the 1st error
      // However, we always want to show the error if for some reason it's the only error
      if (errors.length !== 1 && skippableErrors.find(val => val === error.type) != null) continue;
      console.error({
        name: name ?? 'Configuration root',
        path: error.path,
        valueProvided: error.value,
        message: error.message,
      });
    }
    if (errors.length > 1) {
      throw new Error(`[cde-config] extensions field missing or invalid. See above for error.`);
    }
  }

  const decoded = Value.Decode(structure, config);
  return decoded;
}

function hashConfig(config: any): number {
  // fnv returns an unsigned int, but postgres doesn't support unsigned ints
  const unsignedInt = fnv.fast1a32(stableStringify(config));
  // map unsigned into signed in. Obviously this isn't lossless, but it's still good enough for collision avoidance
  return Math.floor(unsignedInt / 2);
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
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.ERC20,
        contract: getErc20Contract(config.contractAddress, web3),
      };
    case CdeEntryTypeName.ERC721:
      if (await isPaimaErc721(config, web3)) {
        return {
          ...config,
          cdeId: index,
          hash: hashConfig(config),
          cdeType: ChainDataExtensionType.PaimaERC721,
          contract: getPaimaErc721Contract(config.contractAddress, web3),
        };
      } else {
        return {
          ...config,
          cdeId: index,
          hash: hashConfig(config),
          cdeType: ChainDataExtensionType.ERC721,
          contract: getErc721Contract(config.contractAddress, web3),
        };
      }
    case CdeEntryTypeName.ERC20Deposit:
      return {
        ...config,
        cdeId: index,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.ERC20Deposit,
        contract: getErc20Contract(config.contractAddress, web3),
      };
    case CdeEntryTypeName.Generic:
      return await instantiateCdeGeneric(config, index, web3);
    case CdeEntryTypeName.ERC6551Registry:
      const contractAddress = config.contractAddress ?? ERC6551_REGISTRY_DEFAULT.New;
      return {
        ...config,
        cdeId: index,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.ERC6551Registry,
        contractAddress,
        contract: ((): ChainDataExtensionErc6551Registry['contract'] => {
          if (contractAddress === ERC6551_REGISTRY_DEFAULT.Old) {
            return getOldErc6551RegistryContract(contractAddress, web3);
          }
          // assume everything else is using the new contract
          return getErc6551RegistryContract(contractAddress, web3);
        })(),
      };
    default:
      assertNever(config);
  }
}

export async function isPaimaErc721(
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
  const eventMatch = eventSignature.match(/^[A-Za-z0-9_]+/); // ex: MyEvent(address,uint256) → "MyEvent"
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
      hash: hashConfig(config),
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
