import * as fs from 'fs/promises';
import YAML from 'yaml';
import Web3 from 'web3';
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
  getInverseAppProjected1155Contract,
} from '@paima/utils';

import type {
  ChainDataExtension,
  ChainDataExtensionErc6551Registry,
  ChainDataExtensionGeneric,
  TChainDataExtensionErc721Config,
  TChainDataExtensionGenericConfig,
  CdeConfig,
} from '@paima/sm';
import {
  CdeBaseConfig,
  CdeEntryTypeName,
  ChainDataExtensionCardanoDelayedAssetConfig,
  ChainDataExtensionCardanoDelegationConfig,
  ChainDataExtensionCardanoMintBurnConfig,
  ChainDataExtensionCardanoProjectedNFTConfig,
  ChainDataExtensionCardanoTransferConfig,
  ChainDataExtensionErc20Config,
  ChainDataExtensionErc20DepositConfig,
  ChainDataExtensionErc6551RegistryConfig,
  ChainDataExtensionErc721Config,
  ChainDataExtensionGenericConfig,
  ChainDataExtensionInverseAppProjected1155Config,
} from '@paima/sm';
import { loadAbi } from './utils.js';
import assertNever from 'assert-never';
import fnv from 'fnv-plus';
import stableStringify from 'json-stable-stringify';

type ValidationResult = [config: ChainDataExtension[], validated: boolean];

export async function loadChainDataExtensions(
  web3s: { [network: string]: Web3 },
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
      config.extensions.map((e, i) => instantiateExtension(e, i, web3s))
    );
    return [instantiatedExtensions, true];
  } catch (err) {
    doLog(`[cde-config] Invalid config file: ${err}`);
    return [[], false];
  }
}

const networkTagType = Type.Partial(Type.Object({ network: Type.String() }));

// Validate the overall structure of the config file and extract the relevant data
export function parseCdeConfigFile(configFileData: string): Static<typeof CdeConfig> {
  // Parse the YAML content into an object
  const configObject = YAML.parse(configFileData);

  // Validate the YAML object against the schema
  const baseConfig = checkOrError(undefined, CdeBaseConfig, configObject);

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
      case CdeEntryTypeName.InverseAppProjected1155:
        return checkOrError(
          entry.name,
          Type.Intersect([
            ChainDataExtensionInverseAppProjected1155Config,
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
      if (await isPaimaErc721(config, web3s[config.network || defaultEvmMainNetworkName])) {
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
    case CdeEntryTypeName.InverseAppProjected1155:
      return {
        ...config,
        network,
        cdeId: index,
        hash: hashConfig(config),
        cdeType: ChainDataExtensionType.InverseAppProjected1155,
        contract: getInverseAppProjected1155Contract(config.contractAddress, web3s[network]),
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
    default:
      assertNever(config);
  }
}

interface Eip165Query {
  name: string, // for logging
  id: string, // actual EIP-165 ID, in format '0x00000000'
}

async function contractSupportsInterface(
  iface: Eip165Query,
  cdeConfig: {
    contractAddress: string,
  },
  web3: Web3
): Promise<boolean> {
  try {
    const erc165Contract = getErc165Contract(cdeConfig.contractAddress, web3);
    return await erc165Contract.methods.supportsInterface(iface.id).call();
  } catch (err) {
    doLog(`[cde-config] ${cdeConfig.contractAddress} check for interface ${iface.id} (${iface.name}) failed:`, err);
    return false;
  }
}

/** Assert that the hardcoded interface ID and a freshly computed one match. */
function interfaceId(expected: string, methods: string[]): string {
  let id = 0;
  for (const method of methods) {
    id ^= Web3.utils.toDecimal(Web3.utils.keccak256(method));
  }
  const computed = Web3.utils.toHex(id);
  if (expected != computed) {
    throw new Error(`interfaceId expected ${expected}, computed ${computed}`);
  }
  return expected;
}
const IInverseBaseProjectedNft: Eip165Query = {
  name: 'IInverseBaseProjectedNft',
  id: interfaceId('0xd0def521', [
    'mint(address,string)',
  ]),
};

export async function isPaimaErc721(
  cdeConfig: TChainDataExtensionErc721Config,
  web3: Web3
): Promise<boolean> {
  return await contractSupportsInterface(IInverseBaseProjectedNft, cdeConfig, web3);
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
    doLog(`[cde-config]: Fail to initialize Web3 contract with ABI ${config.abiPath}`);
    throw err;
  }
}
