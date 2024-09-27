import { Type } from '@sinclair/typebox';
import {
  ChainDataExtensionDynamicEvmPrimitiveConfig,
  ChainDataExtensionErc1155Config,
  ChainDataExtensionErc20Config,
  ChainDataExtensionErc20DepositConfig,
  ChainDataExtensionErc6551RegistryConfig,
  ChainDataExtensionErc721Config,
  ChainDataExtensionGenericConfig,
} from './evm.js';
import {
  ChainDataExtensionCardanoDelegationConfig,
  ChainDataExtensionCardanoProjectedNFTConfig,
  ChainDataExtensionCardanoDelayedAssetConfig,
  ChainDataExtensionCardanoTransferConfig,
  ChainDataExtensionCardanoMintBurnConfig,
} from './cardano.js';
import {
  ChainDataExtensionMinaEventGenericConfig,
  ChainDataExtensionMinaActionGenericConfig,
} from './mina.js';
import { ChainDataExtensionMidnightContractStateConfig } from './midnight.js';
export * from './evm.js';
export * from './cardano.js';
export * from './mina.js';
export * from './midnight.js';
export * from './types.js';

export const ConfigPrimitiveAll = Type.Union([
  ChainDataExtensionErc20Config,
  ChainDataExtensionErc20DepositConfig,
  ChainDataExtensionErc721Config,
  ChainDataExtensionErc1155Config,
  ChainDataExtensionErc6551RegistryConfig,
  ChainDataExtensionGenericConfig,
  ChainDataExtensionCardanoDelegationConfig,
  ChainDataExtensionCardanoProjectedNFTConfig,
  ChainDataExtensionCardanoDelayedAssetConfig,
  ChainDataExtensionCardanoTransferConfig,
  ChainDataExtensionCardanoMintBurnConfig,
  ChainDataExtensionMinaEventGenericConfig,
  ChainDataExtensionMinaActionGenericConfig,
  ChainDataExtensionDynamicEvmPrimitiveConfig,
  ChainDataExtensionMidnightContractStateConfig,
]);
