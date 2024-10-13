import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';
import { ConfigSchema } from '../utils.js';
import { ConfigNetworkType } from './types.js';
import { MergeIntersects } from '@paima/utils';

// =====
// Utils
// =====

// none

// ===========
// Base schema
// ===========

export const ConfigNetworkSchemaMidnight = new ConfigSchema({
  required: Type.Object({
    displayName: Type.String(),
    type: Type.Literal(ConfigNetworkType.MIDNIGHT),
    networkId: Type.Number(),
  }),
  optional: Type.Object({}),
});
export type ConfigNetworkMidnight = MergeIntersects<
  Static<ReturnType<typeof ConfigNetworkSchemaMidnight.allProperties<true>>>
>;

// ===========
// Conversions
// ===========

// none
