import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';
import { ConfigSchema } from '../utils.js';
import { ConfigNetworkType } from './types.js';
import { MergeIntersects, TypeboxHelpers } from '@paima/utils';

// =====
// Utils
// =====

export const AvailGenesisHashNetwork = TypeboxHelpers.HexString({
  maxLength: 66,
  minLength: 66,
});

// ===========
// Base schema
// ===========

export const ConfigNetworkSchemaAvail = new ConfigSchema({
  required: Type.Object({
    displayName: Type.String(),
    type: Type.Literal(ConfigNetworkType.AVAIL),
    genesisHash: AvailGenesisHashNetwork,
  }),
  optional: Type.Object({}),
});
export type ConfigNetworkAvail = MergeIntersects<
  Static<ReturnType<typeof ConfigNetworkSchemaAvail.allProperties<true>>>
>;

// ===========
// Conversions
// ===========

// none
