import * as fs from 'fs/promises';
import YAML from 'yaml';
import type Web3 from 'web3';
import { keccak_256 } from 'js-sha3';
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
  CdeConfig,
  ChainDataExtensionDynamicEvmPrimitive,
} from '@paima/sm';
import { CdeBaseConfig } from '@paima/sm';
import type {
  TChainDataExtensionDynamicEvmPrimitiveConfig,
  TChainDataExtensionErc721Config,
  TChainDataExtensionGenericConfig,
} from '@paima/config';
import {
  ChainDataExtensionCardanoDelayedAssetConfig,
  ChainDataExtensionCardanoDelegationConfig,
  ChainDataExtensionCardanoMintBurnConfig,
  ChainDataExtensionCardanoProjectedNFTConfig,
  ChainDataExtensionCardanoTransferConfig,
  ChainDataExtensionDynamicEvmPrimitiveConfig,
  ChainDataExtensionErc1155Config,
  ChainDataExtensionErc20Config,
  ChainDataExtensionErc20DepositConfig,
  ChainDataExtensionErc6551RegistryConfig,
  ChainDataExtensionErc721Config,
  ChainDataExtensionGenericConfig,
  ChainDataExtensionMidnightContractStateConfig,
  ChainDataExtensionMinaActionGenericConfig,
  ChainDataExtensionMinaEventGenericConfig,
  ConfigPrimitiveType,
} from '@paima/config';
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
    try {
      // try falling back to previous default from Paima Engine v2.4.0
      configFileData = await fs.readFile(`extensions.yml`, 'utf8');
    } catch (err) {
      doLog(`[cde-config] config file not found: ${configFilePath}, assuming no CDEs.`);
      return [[], true];
    }
  }

  let dynamicExtensions: { displayName: string; type: ConfigPrimitiveType }[];

  try {
    // note: this fails the first time, as db tables are not initialized yet. That's okay
    const dbResult = await getDynamicExtensions.run(undefined, db);

    dynamicExtensions = dbResult.map(ext =>
      checkOrError(
        undefined,
        Type.Object({
          displayName: Type.String(),
          type: Type.Enum(ConfigPrimitiveType),
        }),
        { ...(ext.config as Record<string, unknown>), displayName: ext.cde_name, includeNameInInput: true }
      )
    );
  } catch (err) {
    // the first time the db tables are not initialized
    dynamicExtensions = [];
  }

  try {
    const config = parseCdeConfigFile(configFileData, dynamicExtensions);
    const instantiatedExtensions = await Promise.all(
      config.extensions.map(e => instantiateExtension(e, web3s))
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
  extraExtensions: { displayName: string; type: ConfigPrimitiveType }[]
): Static<typeof CdeConfig> {
  // Parse the YAML content into an object
  const configObject = YAML.parse(configFileData, { merge: true });

  // Validate the YAML object against the schema
  const baseConfig = checkOrError(undefined, CdeBaseConfig, configObject);

  for (const extension of extraExtensions) {
    baseConfig.extensions.push(extension);
  }

  const checkedConfig = baseConfig.extensions.map(entry => {
    switch (entry.type) {
      case ConfigPrimitiveType.ERC20:
        return checkOrError(
          entry.displayName,
          Type.Intersect([ChainDataExtensionErc20Config, networkTagType]),
          entry
        );
      case ConfigPrimitiveType.ERC721:
        return checkOrError(
          entry.displayName,
          Type.Intersect([ChainDataExtensionErc721Config, networkTagType]),
          entry
        );
      case ConfigPrimitiveType.ERC20Deposit:
        return checkOrError(
          entry.displayName,
          Type.Intersect([ChainDataExtensionErc20DepositConfig, networkTagType]),
          entry
        );
      case ConfigPrimitiveType.Generic:
        return checkOrError(
          entry.displayName,
          Type.Intersect([ChainDataExtensionGenericConfig, networkTagType]),
          entry
        );
      case ConfigPrimitiveType.ERC6551Registry:
        return checkOrError(
          entry.displayName,
          Type.Intersect([ChainDataExtensionErc6551RegistryConfig, networkTagType]),
          entry
        );
      case ConfigPrimitiveType.DynamicEvmPrimitive:
        return checkOrError(
          entry.displayName,
          Type.Intersect([ChainDataExtensionDynamicEvmPrimitiveConfig, networkTagType]),
          entry
        );
      case ConfigPrimitiveType.CardanoDelegation:
        return checkOrError(
          entry.displayName,
          Type.Intersect([ChainDataExtensionCardanoDelegationConfig, networkTagType]),
          entry
        );
      case ConfigPrimitiveType.CardanoProjectedNFT:
        return checkOrError(
          entry.displayName,
          Type.Intersect([ChainDataExtensionCardanoProjectedNFTConfig, networkTagType]),
          entry
        );
      case ConfigPrimitiveType.CardanoDelayedAsset:
        return checkOrError(
          entry.displayName,
          Type.Intersect([ChainDataExtensionCardanoDelayedAssetConfig, networkTagType]),
          entry
        );
      case ConfigPrimitiveType.CardanoTransfer:
        return checkOrError(
          entry.displayName,
          Type.Intersect([
            ChainDataExtensionCardanoTransferConfig,
            Type.Object({ network: Type.String() }),
          ]),
          entry
        );
      case ConfigPrimitiveType.CardanoMintBurn:
        return checkOrError(
          entry.displayName,
          Type.Intersect([
            ChainDataExtensionCardanoMintBurnConfig,
            Type.Object({ network: Type.String() }),
          ]),
          entry
        );
      case ConfigPrimitiveType.ERC1155:
        return checkOrError(
          entry.displayName,
          Type.Intersect([
            ChainDataExtensionErc1155Config,
            Type.Object({ network: Type.String() }),
          ]),
          entry
        );
      case ConfigPrimitiveType.MinaEventGeneric:
        return checkOrError(
          entry.displayName,
          Type.Intersect([ChainDataExtensionMinaEventGenericConfig, networkTagType]),
          entry
        );
      case ConfigPrimitiveType.MinaActionGeneric:
        return checkOrError(
          entry.displayName,
          Type.Intersect([ChainDataExtensionMinaActionGenericConfig, networkTagType]),
          entry
        );
      case ConfigPrimitiveType.MidnightContractState:
        return checkOrError(
          entry.displayName,
          Type.Intersect([
            ChainDataExtensionMidnightContractStateConfig,
            Type.Object({ network: Type.String() }),
          ]),
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

// TODO: probably we should remove extensions.yml and move it entirely into config to avoid this
function getNetworkName(
  config: Static<typeof CdeConfig>['extensions'][0],
  network: string | undefined,
  defaultName: string,
  web3s: { [network: string]: Web3 }
): string {
  if (network != null) return network;
  for (const web3 of Object.keys(web3s)) {
    if (web3 === defaultName) {
      return defaultName;
    }
  }
  throw new Error(
    `No "network" key specified for ${config.displayName}, but no network in config.yml matched the default: ${defaultName}`
  );
}

// Do type-specific initialization and construct contract objects
async function instantiateExtension(
  config: Static<typeof CdeConfig>['extensions'][0],
  web3s: { [network: string]: Web3 }
): Promise<ChainDataExtension> {
  const getDefaultEvmNetwork = (): string =>
    getNetworkName(config, config.network, defaultEvmMainNetworkName, web3s);
  const getDefaultCardanoNetwork = (): string =>
    getNetworkName(config, config.network, defaultCardanoNetworkName, web3s);
  const getDefaultMinaNetwork = (): string =>
    getNetworkName(config, config.network, defaultMinaNetworkName, web3s);
  switch (config.type) {
    case ConfigPrimitiveType.ERC20: {
      const network = getDefaultEvmNetwork();
      return {
        ...config,
        network,
        cdeName: config.displayName,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.ERC20,
        contract: getErc20Contract(config.contractAddress, web3s[network]),
      };
    }
    case ConfigPrimitiveType.ERC721: {
      const network = getDefaultEvmNetwork();
      if (await isPaimaErc721(config, web3s[network])) {
        return {
          ...config,
          network,
          cdeName: config.displayName,
          hash: hashConfig(config),
          cdeType: ChainDataExtensionType.PaimaERC721,
          contract: getPaimaErc721Contract(config.contractAddress, web3s[network]),
        };
      } else {
        return {
          ...config,
          network,
          cdeName: config.displayName,
          hash: hashConfig(config),
          cdeType: ChainDataExtensionType.ERC721,
          contract: getErc721Contract(config.contractAddress, web3s[network]),
        };
      }
    }
    case ConfigPrimitiveType.ERC20Deposit: {
      const network = getDefaultEvmNetwork();
      return {
        ...config,
        network,
        cdeName: config.displayName,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.ERC20Deposit,
        contract: getErc20Contract(config.contractAddress, web3s[network]),
      };
    }
    case ConfigPrimitiveType.ERC1155: {
      const network = getDefaultEvmNetwork();
      return {
        ...config,
        network,
        cdeName: config.displayName,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.ERC1155,
        contract: getErc1155Contract(config.contractAddress, web3s[network]),
      };
    }
    case ConfigPrimitiveType.Generic: {
      const network = getDefaultEvmNetwork();
      return {
        ...(await instantiateCdeGeneric(config, web3s[network])),
        network,
      };
    }
    case ConfigPrimitiveType.ERC6551Registry: {
      const network = getDefaultEvmNetwork();
      const contractAddress = config.contractAddress ?? ERC6551_REGISTRY_DEFAULT.New;
      return {
        ...config,
        network,
        cdeName: config.displayName,
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
    }
    case ConfigPrimitiveType.DynamicEvmPrimitive: {
      const network = getDefaultEvmNetwork();
      return {
        ...(await instantiateCdeDynamicEvmPrimitive(config, web3s[network])),
        network,
      };
    }
    case ConfigPrimitiveType.CardanoDelegation: {
      const network = getDefaultCardanoNetwork();
      return {
        ...config,
        network,
        cdeName: config.displayName,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.CardanoPool,
      };
    }
    case ConfigPrimitiveType.CardanoProjectedNFT: {
      const network = getDefaultCardanoNetwork();
      return {
        ...config,
        network,
        cdeName: config.displayName,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.CardanoProjectedNFT,
      };
    }
    case ConfigPrimitiveType.CardanoDelayedAsset: {
      const network = getDefaultCardanoNetwork();
      return {
        ...config,
        network,
        cdeName: config.displayName,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.CardanoAssetUtxo,
      };
    }
    case ConfigPrimitiveType.CardanoTransfer: {
      const network = getDefaultCardanoNetwork();
      return {
        ...config,
        network,
        cdeName: config.displayName,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.CardanoTransfer,
      };
    }
    case ConfigPrimitiveType.CardanoMintBurn: {
      const network = getDefaultCardanoNetwork();
      return {
        ...config,
        network,
        cdeName: config.displayName,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.CardanoMintBurn,
      };
    }
    case ConfigPrimitiveType.MinaEventGeneric: {
      const network = getDefaultMinaNetwork();
      return {
        ...config,
        network,
        cdeName: config.displayName,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.MinaEventGeneric,
      };
    }
    case ConfigPrimitiveType.MinaActionGeneric: {
      const network = getDefaultMinaNetwork();
      return {
        ...config,
        network,
        cdeName: config.displayName,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.MinaActionGeneric,
      };
    }
    case ConfigPrimitiveType.MidnightContractState: {
      if (!config.network) throw new Error('Midnight extension config is missing `network` name');
      return {
        ...config,
        network: config.network, // Repeated for TypeScript reasons.
        cdeName: config.displayName,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.MidnightContractState,
      };
    }
    default:
      assertNever(config);
  }
}

export async function isPaimaErc721(
  cdeConfig: TChainDataExtensionErc721Config,
  web3: Web3
): Promise<boolean> {
  const PAIMA_EXTENDED_MINT_SIGNATURE = 'mint(address,string)';
  const interfaceId = keccak_256(PAIMA_EXTENDED_MINT_SIGNATURE).substring(0, 10);
  try {
    const erc165Contract = getErc165Contract(cdeConfig.contractAddress, web3);
    return await erc165Contract.methods.supportsInterface(interfaceId).call();
  } catch (err) {
    doLog(`[cde-config] ${cdeConfig.contractAddress} is probably not PaimaERC721: ${err}`);
    return false;
  }
}

export async function instantiateCdeGeneric(
  config: TChainDataExtensionGenericConfig,
  web3: Web3
): Promise<ChainDataExtensionGeneric> {
  const eventSignature = config.eventSignature;
  const eventMatch = eventSignature.match(/^[A-Za-z0-9_]+/); // ex: MyEvent(address,uint256) → "MyEvent"
  if (!eventMatch) {
    throw new Error('[cde-config] Event signature invalid!');
  }
  const eventName = eventMatch[0];
  const eventSignatureHash = keccak_256(eventSignature);

  try {
    const contract = getAbiContract(
      config.contractAddress,
      JSON.parse(config.abi) as AbiItem[],
      web3
    );
    return {
      ...config,
      cdeName: config.displayName,
      hash: hashConfig(config),
      cdeType: ChainDataExtensionType.Generic,
      contract,
      eventSignature,
      eventName,
      eventSignatureHash,
    };
  } catch (err) {
    doLog(`[cde-config] Failed to initialize Web3 contract ${config.displayName}`);
    throw err;
  }
}

async function instantiateCdeDynamicEvmPrimitive(
  config: TChainDataExtensionDynamicEvmPrimitiveConfig,
  web3: Web3
): Promise<ChainDataExtensionDynamicEvmPrimitive> {
  const eventSignature = config.eventSignature;
  const eventMatch = eventSignature.match(/^[A-Za-z0-9_]+/); // ex: MyEvent(address,uint256) → "MyEvent"
  if (!eventMatch) {
    throw new Error('[cde-config] Event signature invalid!');
  }
  const eventName = eventMatch[0];
  const eventSignatureHash = keccak_256(eventSignature);

  try {
    const contract = getAbiContract(
      config.contractAddress,
      JSON.parse(config.abi) as AbiItem[],
      web3
    );
    return {
      ...config,
      cdeName: config.displayName,
      hash: hashConfig(config),
      cdeType: ChainDataExtensionType.DynamicEvmPrimitive,
      contract,
      eventSignature,
      eventName,
      eventSignatureHash,
    };
  } catch (err) {
    doLog(`[cde-config] Failed to initialize Web3 contract ${config.displayName}`);
    throw err;
  }
}
