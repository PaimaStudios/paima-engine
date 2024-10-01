import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';
import { ConfigPrimitiveType } from './types.js';
import { DisplayName, StartStopBlockheight } from './common.js';

export const ChainDataExtensionConfigBaseMidnight = Type.Intersect([
  DisplayName,
  StartStopBlockheight,
]);

// =======
// Generic
// =======

export const ChainDataExtensionMidnightContractStateConfig = Type.Intersect([
  ChainDataExtensionConfigBaseMidnight,
  Type.Object({
    type: Type.Literal(ConfigPrimitiveType.MidnightContractState),
    name: Type.String(),

    contractAddress: Type.String(),
    scheduledPrefix: Type.String(),
  }),
]);
