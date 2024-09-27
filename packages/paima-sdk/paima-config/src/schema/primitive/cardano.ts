import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';
import { ConfigPrimitiveType } from './types.js';
import { DisplayName, StartStopSlot } from './common.js';

export const ChainDataExtensionConfigBaseCardano = Type.Intersect([DisplayName, StartStopSlot]);

// ==========
// Delegation
// ==========

export const ChainDataExtensionCardanoDelegationConfig = Type.Intersect([
  ChainDataExtensionConfigBaseCardano,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.CardanoDelegation),
    pools: Type.Array(Type.String()),
    scheduledPrefix: Type.String(),
  }),
]);

// ======
// Assets
// ======

export const ChainDataExtensionCardanoProjectedNFTConfig = Type.Intersect([
  ChainDataExtensionConfigBaseCardano,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.CardanoProjectedNFT),
    scheduledPrefix: Type.Optional(Type.String()),
  }),
]);

export const ChainDataExtensionCardanoDelayedAssetConfig = Type.Intersect([
  ChainDataExtensionConfigBaseCardano,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.CardanoDelayedAsset),
    fingerprints: Type.Optional(Type.Array(Type.String())),
    policyIds: Type.Optional(Type.Array(Type.String())),
  }),
]);

export const ChainDataExtensionCardanoTransferConfig = Type.Intersect([
  ChainDataExtensionConfigBaseCardano,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.CardanoTransfer),
    credential: Type.String(),
    scheduledPrefix: Type.String(),
  }),
]);

export const ChainDataExtensionCardanoMintBurnConfig = Type.Intersect([
  ChainDataExtensionConfigBaseCardano,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.CardanoMintBurn),
    policyIds: Type.Array(Type.String()),
    scheduledPrefix: Type.String(),
  }),
]);
