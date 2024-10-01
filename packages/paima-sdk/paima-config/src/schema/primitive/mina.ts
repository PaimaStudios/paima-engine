import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';
import { ConfigPrimitiveType } from './types.js';
import { DisplayName, StartStopBlockheight } from './common.js';

export const ChainDataExtensionConfigBaseMina = Type.Intersect([DisplayName, StartStopBlockheight]);

// =======
// Generic
// =======

export const ChainDataExtensionMinaEventGenericConfig = Type.Intersect([
  ChainDataExtensionConfigBaseMina,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.MinaEventGeneric),
    address: Type.String(),
    scheduledPrefix: Type.String(),
    name: Type.String(),
  }),
]);

export const ChainDataExtensionMinaActionGenericConfig = Type.Intersect([
  ChainDataExtensionConfigBaseMina,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.MinaActionGeneric),
    address: Type.String(),
    scheduledPrefix: Type.String(),
    name: Type.String(),
  }),
]);
