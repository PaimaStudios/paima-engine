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

export const ConfigNetworkSchemaMina = new ConfigSchema({
  required: Type.Object({
    displayName: Type.String(),
    type: Type.Literal(ConfigNetworkType.MINA),
    networkId: Type.String(),
  }),
  optional: Type.Object({}),
});
export type ConfigNetworkMina = MergeIntersects<
  Static<ReturnType<typeof ConfigNetworkSchemaMina.allProperties<true>>>
>;

// ===========
// Conversions
// ===========

// none
