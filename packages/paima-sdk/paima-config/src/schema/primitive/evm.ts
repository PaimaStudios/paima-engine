import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';
import { EvmAddress } from '../utils.js';
import { ConfigPrimitiveType } from './types.js';
import { Abi } from 'abitype/zod';

const ChainDataExtensionConfigBase = Type.Object({
  displayName: Type.String(),
  startBlockHeight: Type.Number(),
});

const AbiType = Type.Transform(Type.String())
  .Decode(value => Abi.parse(JSON.parse(value)))
  .Encode(value => JSON.stringify(value));

// =====
// ERC20
// =====

export const ChainDataExtensionErc20Config = Type.Intersect([
  ChainDataExtensionConfigBase,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.ERC20),
    contractAddress: EvmAddress,
  }),
]);

export const ChainDataExtensionErc20DepositConfig = Type.Intersect([
  ChainDataExtensionConfigBase,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.ERC20Deposit),
    contractAddress: EvmAddress,
    scheduledPrefix: Type.String(),
    depositAddress: EvmAddress,
  }),
]);

// ======
// ERC721
// ======

export const ChainDataExtensionErc721Config = Type.Intersect([
  ChainDataExtensionConfigBase,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.ERC721),
    contractAddress: EvmAddress,
    scheduledPrefix: Type.String(),
    burnScheduledPrefix: Type.Optional(Type.String()),
  }),
]);
export type TChainDataExtensionErc721Config = Static<typeof ChainDataExtensionErc721Config>;

// =======
// ERC1155
// =======

export const ChainDataExtensionErc1155Config = Type.Intersect([
  ChainDataExtensionConfigBase,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.ERC1155),
    contractAddress: EvmAddress,
    scheduledPrefix: Type.Optional(Type.String()),
    burnScheduledPrefix: Type.Optional(Type.String()),
  }),
]);

// =======
// Generic
// =======

export const ChainDataExtensionGenericConfig = Type.Intersect([
  ChainDataExtensionConfigBase,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.Generic),
    contractAddress: EvmAddress,
    abi: AbiType,
    eventSignature: Type.String(),
    scheduledPrefix: Type.String(),
  }),
]);
export type TChainDataExtensionGenericConfig = Static<typeof ChainDataExtensionGenericConfig>;

// =======
// ERC6551
// =======

export const ChainDataExtensionErc6551RegistryConfig = Type.Intersect([
  ChainDataExtensionConfigBase,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.ERC6551Registry),
    contractAddress: Type.Optional(EvmAddress),
    implementation: Type.Optional(EvmAddress),
    tokenContract: Type.Optional(EvmAddress),
    tokenId: Type.Optional(Type.String()), // uint256
    salt: Type.Optional(Type.String()), // uint256
  }),
]);

// =======
// Dynamic
// =======

export const ChainDataExtensionDynamicEvmPrimitiveConfig = Type.Intersect([
  ChainDataExtensionConfigBase,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.DynamicEvmPrimitive),
    contractAddress: EvmAddress,
    abi: AbiType,
    eventSignature: Type.String(),
    targetConfig: Type.Union([
      Type.Pick(ChainDataExtensionErc721Config, ['scheduledPrefix', 'burnScheduledPrefix', 'type']),
      Type.Pick(ChainDataExtensionGenericConfig, [
        'abi',
        'eventSignature',
        'scheduledPrefix',
        'type',
      ]),
    ]),
    dynamicFields: Type.Object({
      contractAddress: Type.String(),
    }),
  }),
]);
export type TChainDataExtensionDynamicEvmPrimitiveConfig = Static<
  typeof ChainDataExtensionDynamicEvmPrimitiveConfig
>;
