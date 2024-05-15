import * as fs from 'fs/promises';
import YAML from 'yaml';
import type Web3 from 'web3';
import { Type, type Static, type TSchema } from '@sinclair/typebox';
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
  defaultEvmMainNetworkName,
  defaultCardanoNetworkName,
  getErc1155Contract,
  defaultMinaNetworkName,
} from '@paima/utils';

import type {
  ChainDataExtension,
  ChainDataExtensionErc6551Registry,
  ChainDataExtensionGeneric,
  TChainDataExtensionErc721Config,
  TChainDataExtensionGenericConfig,
  CdeConfig,
  TChainDataExtensionDynamicPrimitiveConfig,
  ChainDataExtensionDynamicPrimitive,
} from '@paima/sm';
import {
  CdeBaseConfig,
  CdeEntryTypeName,
  ChainDataExtensionCardanoDelayedAssetConfig,
  ChainDataExtensionCardanoDelegationConfig,
  ChainDataExtensionCardanoMintBurnConfig,
  ChainDataExtensionCardanoProjectedNFTConfig,
  ChainDataExtensionCardanoTransferConfig,
  ChainDataExtensionErc1155Config,
  ChainDataExtensionErc20Config,
  ChainDataExtensionErc20DepositConfig,
  ChainDataExtensionErc6551RegistryConfig,
  ChainDataExtensionErc721Config,
  ChainDataExtensionGenericConfig,
  ChainDataExtensionMinaEventGenericConfig,
  ChainDataExtensionMinaActionGenericConfig,
  ChainDataExtensionDynamicPrimitiveConfig,
} from '@paima/sm';
import { loadAbi } from './utils.js';
import assertNever from 'assert-never';
import fnv from 'fnv-plus';
import stableStringify from 'json-stable-stringify';
import type { PoolClient } from 'pg';
import { getDynamicExtensions } from '@paima/db';

type ValidationResult = [config: ChainDataExtension[], validated: boolean];

export async function loadChainDataExtensions(
  web3s: { [network: string]: Web3 },
  configFilePath: string,
  db: PoolClient
): Promise<ValidationResult> {
  let configFileData: string;
  try {
    configFileData = await fs.readFile(configFilePath, 'utf8');
  } catch (err) {
    doLog(`[cde-config] config file not found: ${configFilePath}, assuming no CDEs.`);
    return [[], true];
  }

  let dynamicExtensions: { name: string; type: CdeEntryTypeName }[];

  try {
    const dbResult = await getDynamicExtensions.run(undefined, db);

    dynamicExtensions = dbResult.map(ext =>
      checkOrError(
        undefined,
        Type.Object({
          name: Type.String(),
          type: Type.Enum(CdeEntryTypeName),
        }),
        { ...YAML.parse(ext.config) }
      )
    );
  } catch (err) {
    // the first time the db tables are not initialized
    dynamicExtensions = [];
  }

  try {
    const config = parseCdeConfigFile(configFileData, dynamicExtensions);
    const instantiatedExtensions = await Promise.all(
      config.extensions.map((e, i) => instantiateExtension(e, i, web3s))
    );
    return [instantiatedExtensions, true];
  } catch (err) {
    doLog(`[cde-config] Invalid config file:`, err);
    return [[], false];
  }
}

const networkTagType = Type.Partial(Type.Object({ network: Type.String() }));

// Validate the overall structure of the config file and extract the relevant data
export function parseCdeConfigFile(
  configFileData: string,
  extraExtensions: { name: string; type: CdeEntryTypeName }[]
): Static<typeof CdeConfig> {
  // Parse the YAML content into an object
  const configObject = YAML.parse(configFileData);

  // Validate the YAML object against the schema
  const baseConfig = checkOrError(undefined, CdeBaseConfig, configObject);

  for (const extension of extraExtensions) {
    baseConfig.extensions.push(extension);
  }

  const checkedConfig = baseConfig.extensions.map(entry => {
    switch (entry.type) {
      case CdeEntryTypeName.ERC20:
        return checkOrError(
          entry.name,
          Type.Intersect([ChainDataExtensionErc20Config, networkTagType]),
          entry
        );
      case CdeEntryTypeName.ERC721:
        return checkOrError(
          entry.name,
          Type.Intersect([ChainDataExtensionErc721Config, networkTagType]),
          entry
        );
      case CdeEntryTypeName.ERC20Deposit:
        return checkOrError(
          entry.name,
          Type.Intersect([ChainDataExtensionErc20DepositConfig, networkTagType]),
          entry
        );
      case CdeEntryTypeName.Generic:
        return checkOrError(
          entry.name,
          Type.Intersect([ChainDataExtensionGenericConfig, networkTagType]),
          entry
        );
      case CdeEntryTypeName.ERC6551Registry:
        return checkOrError(
          entry.name,
          Type.Intersect([ChainDataExtensionErc6551RegistryConfig, networkTagType]),
          entry
        );
      case CdeEntryTypeName.DynamicPrimitive:
        return checkOrError(
          entry.name,
          Type.Intersect([ChainDataExtensionDynamicPrimitiveConfig, networkTagType]),
          entry
        );
      case CdeEntryTypeName.CardanoDelegation:
        return checkOrError(
          entry.name,
          Type.Intersect([ChainDataExtensionCardanoDelegationConfig, networkTagType]),
          entry
        );
      case CdeEntryTypeName.CardanoProjectedNFT:
        return checkOrError(
          entry.name,
          Type.Intersect([ChainDataExtensionCardanoProjectedNFTConfig, networkTagType]),
          entry
        );
      case CdeEntryTypeName.CardanoDelayedAsset:
        return checkOrError(
          entry.name,
          Type.Intersect([ChainDataExtensionCardanoDelayedAssetConfig, networkTagType]),
          entry
        );
      case CdeEntryTypeName.CardanoTransfer:
        return checkOrError(
          entry.name,
          Type.Intersect([
            ChainDataExtensionCardanoTransferConfig,
            Type.Object({ network: Type.String() }),
          ]),
          entry
        );
      case CdeEntryTypeName.CardanoMintBurn:
        return checkOrError(
          entry.name,
          Type.Intersect([
            ChainDataExtensionCardanoMintBurnConfig,
            Type.Object({ network: Type.String() }),
          ]),
          entry
        );
      case CdeEntryTypeName.ERC1155:
        return checkOrError(
          entry.name,
          Type.Intersect([
            ChainDataExtensionErc1155Config,
            Type.Object({ network: Type.String() }),
          ]),
          entry
        );
      case CdeEntryTypeName.MinaEventGeneric:
        return checkOrError(
          entry.name,
          Type.Intersect([ChainDataExtensionMinaEventGenericConfig, networkTagType]),
          entry
        );
      case CdeEntryTypeName.MinaActionGeneric:
        return checkOrError(
          entry.name,
          Type.Intersect([ChainDataExtensionMinaActionGenericConfig, networkTagType]),
          entry
        );
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
    const lowPriorityErrors = new Set([ValueErrorType.Intersect, ValueErrorType.Union]);

    const errors = Array.from(Value.Errors(structure, config));
    const allErrorsLowPriority = errors.every(e => lowPriorityErrors.has(e.type));
    for (const error of errors) {
      // there are many useless errors in this library
      // ex: 1st error: "foo" should be "bar" in struct Foo
      //     2nd error: struct Foo is invalid inside struct Config
      //     in this case, the 2nd error is useless as we only care about the 1st error
      // However, we always want to show the error if for some reason it's the only error
      if (!allErrorsLowPriority && lowPriorityErrors.has(error.type)) continue;
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

export function hashConfig(config: any): number {
  // fnv returns an unsigned int, but postgres doesn't support unsigned ints
  const unsignedInt = fnv.fast1a32(stableStringify(config));
  // map unsigned into signed in. Obviously this isn't lossless, but it's still good enough for collision avoidance
  return Math.floor(unsignedInt / 2);
}

// Do type-specific initialization and construct contract objects
async function instantiateExtension(
  config: Static<typeof CdeConfig>['extensions'][0],
  index: number,
  web3s: { [network: string]: Web3 }
): Promise<ChainDataExtension> {
  const network = config.network || defaultEvmMainNetworkName;
  switch (config.type) {
    case CdeEntryTypeName.ERC20:
      return {
        ...config,
        network,
        cdeId: index,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.ERC20,
        contract: getErc20Contract(config.contractAddress, web3s[network]),
      };
    case CdeEntryTypeName.ERC721:
      if (await isPaimaErc721(config, web3s[network])) {
        return {
          ...config,
          network,
          cdeId: index,
          hash: hashConfig(config),
          cdeType: ChainDataExtensionType.PaimaERC721,
          contract: getPaimaErc721Contract(config.contractAddress, web3s[network]),
        };
      } else {
        return {
          ...config,
          network,
          cdeId: index,
          hash: hashConfig(config),
          cdeType: ChainDataExtensionType.ERC721,
          contract: getErc721Contract(config.contractAddress, web3s[network]),
        };
      }
    case CdeEntryTypeName.ERC20Deposit:
      return {
        ...config,
        network,
        cdeId: index,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.ERC20Deposit,
        contract: getErc20Contract(config.contractAddress, web3s[network]),
      };
    case CdeEntryTypeName.ERC1155:
      return {
        ...config,
        network,
        cdeId: index,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.ERC1155,
        contract: getErc1155Contract(config.contractAddress, web3s[network]),
      };
    case CdeEntryTypeName.Generic:
      return {
        ...(await instantiateCdeGeneric(config, index, web3s[network])),
        network,
      };
    case CdeEntryTypeName.ERC6551Registry:
      const contractAddress = config.contractAddress ?? ERC6551_REGISTRY_DEFAULT.New;
      return {
        ...config,
        network,
        cdeId: index,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.ERC6551Registry,
        contractAddress,
        contract: ((): ChainDataExtensionErc6551Registry['contract'] => {
          if (contractAddress === ERC6551_REGISTRY_DEFAULT.Old) {
            return getOldErc6551RegistryContract(contractAddress, web3s[network]);
          }
          // assume everything else is using the new contract
          return getErc6551RegistryContract(contractAddress, web3s[network]);
        })(),
      };
    case CdeEntryTypeName.DynamicPrimitive:
      return {
        ...(await instantiateCdeDynamicPrimitive(config, index, web3s[network])),
        network,
      };
    case CdeEntryTypeName.CardanoDelegation:
      return {
        ...config,
        network: config.network || defaultCardanoNetworkName,
        cdeId: index,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.CardanoPool,
      };
    case CdeEntryTypeName.CardanoProjectedNFT:
      return {
        ...config,
        network: config.network || defaultCardanoNetworkName,
        cdeId: index,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.CardanoProjectedNFT,
      };
    case CdeEntryTypeName.CardanoDelayedAsset:
      return {
        ...config,
        network: config.network || defaultCardanoNetworkName,
        cdeId: index,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.CardanoAssetUtxo,
      };
    case CdeEntryTypeName.CardanoTransfer:
      return {
        ...config,
        network: config.network || defaultCardanoNetworkName,
        cdeId: index,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.CardanoTransfer,
      };
    case CdeEntryTypeName.CardanoMintBurn:
      return {
        ...config,
        network: config.network || defaultCardanoNetworkName,
        cdeId: index,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.CardanoMintBurn,
      };
    case CdeEntryTypeName.MinaEventGeneric:
      return {
        ...config,
        network: config.network || defaultMinaNetworkName,
        cdeId: index,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.MinaEventGeneric,
      };
    case CdeEntryTypeName.MinaActionGeneric:
      return {
        ...config,
        network: config.network || defaultMinaNetworkName,
        cdeId: index,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.MinaActionGeneric,
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

  const parsedContractAbi = await loadAbi(config.abiPath);
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
    };
  } catch (err) {
    doLog(
      `[cde-config] Failed to initialize Web3 contract ${config.name} with ABI ${config.abiPath}`
    );
    throw err;
  }
}

async function instantiateCdeDynamicPrimitive(
  config: TChainDataExtensionDynamicPrimitiveConfig,
  index: number,
  web3: Web3
): Promise<ChainDataExtensionDynamicPrimitive> {
  const eventSignature = config.eventSignature;
  const eventMatch = eventSignature.match(/^[A-Za-z0-9_]+/); // ex: MyEvent(address,uint256) → "MyEvent"
  if (!eventMatch) {
    throw new Error('[cde-config] Event signature invalid!');
  }
  const eventName = eventMatch[0];
  const eventSignatureHash = web3.utils.keccak256(eventSignature);

  const parsedContractAbi = await loadAbi(config.abiPath);
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
      cdeType: ChainDataExtensionType.DynamicPrimitive,
      contract,
      eventSignature,
      eventName,
      eventSignatureHash,
    };
  } catch (err) {
    doLog(
      `[cde-config] Failed to initialize Web3 contract ${config.name} with ABI ${config.abiPath}`
    );
    throw err;
  }
}
