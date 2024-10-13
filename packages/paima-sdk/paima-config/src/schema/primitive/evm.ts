import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';
import { ConfigPrimitiveType } from './types.js';
import { Abi } from 'abitype/zod';
import { DisplayName, StartStopBlockheight } from './common.js';
import { MergeIntersects, TypeboxHelpers } from '@paima/utils';

export const ChainDataExtensionConfigBaseEvm = Type.Intersect([DisplayName, StartStopBlockheight]);

export const AbiType = Type.Transform(Type.String())
  .Decode(value => Abi.parse(JSON.parse(value)))
  .Encode(value => JSON.stringify(value));

// =====
// ERC20
// =====

export const ChainDataExtensionErc20Config = Type.Intersect([
  ChainDataExtensionConfigBaseEvm,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.ERC20),
    contractAddress: TypeboxHelpers.EvmAddress,
  }),
]);

export const ChainDataExtensionErc20DepositConfig = Type.Intersect([
  ChainDataExtensionConfigBaseEvm,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.ERC20Deposit),
    contractAddress: TypeboxHelpers.EvmAddress,
    scheduledPrefix: Type.String(),
    depositAddress: TypeboxHelpers.EvmAddress,
  }),
]);

// ======
// ERC721
// ======

export const ChainDataExtensionErc721Config = Type.Intersect([
  ChainDataExtensionConfigBaseEvm,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.ERC721),
    contractAddress: TypeboxHelpers.EvmAddress,
    scheduledPrefix: Type.String(),
    burnScheduledPrefix: Type.Optional(Type.String()),
  }),
]);
export type TChainDataExtensionErc721Config = MergeIntersects<
  Static<typeof ChainDataExtensionErc721Config>
>;

// =======
// ERC1155
// =======

export const ChainDataExtensionErc1155Config = Type.Intersect([
  ChainDataExtensionConfigBaseEvm,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.ERC1155),
    contractAddress: TypeboxHelpers.EvmAddress,
    scheduledPrefix: Type.Optional(Type.String()),
    burnScheduledPrefix: Type.Optional(Type.String()),
  }),
]);

// =======
// Generic
// =======

export const ChainDataExtensionGenericConfig = Type.Intersect([
  ChainDataExtensionConfigBaseEvm,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.Generic),
    contractAddress: TypeboxHelpers.EvmAddress,
    abi: AbiType,
    eventSignature: Type.String(),
    scheduledPrefix: Type.String(),
  }),
]);
export type TChainDataExtensionGenericConfig = MergeIntersects<
  Static<typeof ChainDataExtensionGenericConfig>
>;

// =======
// ERC6551
// =======

export const ChainDataExtensionErc6551RegistryConfig = Type.Intersect([
  ChainDataExtensionConfigBaseEvm,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.ERC6551Registry),
    contractAddress: Type.Optional(TypeboxHelpers.EvmAddress),
    implementation: Type.Optional(TypeboxHelpers.EvmAddress),
    tokenContract: Type.Optional(TypeboxHelpers.EvmAddress),
    tokenId: Type.Optional(Type.String()), // uint256
    salt: Type.Optional(Type.String()), // uint256
  }),
]);

// =======
// Dynamic
// =======

export const ChainDataExtensionDynamicEvmPrimitiveConfig = Type.Intersect([
  ChainDataExtensionConfigBaseEvm,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.DynamicEvmPrimitive),
    contractAddress: TypeboxHelpers.EvmAddress,
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
export type TChainDataExtensionDynamicEvmPrimitiveConfig = MergeIntersects<
  Static<typeof ChainDataExtensionDynamicEvmPrimitiveConfig>
>;
