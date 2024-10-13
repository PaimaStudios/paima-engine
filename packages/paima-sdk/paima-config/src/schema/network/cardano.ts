import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';
import { ConfigSchema } from '../utils.js';
import { ConfigNetworkType } from './types.js';
import { MergeIntersects } from '@paima/utils';

// =====
// Utils
// =====

export const CardanoNetwork = Type.Union([
  Type.Literal('preview'),
  Type.Literal('preprod'),
  Type.Literal('mainnet'),
  // TODO: support custom networks
]);

// ===========
// Base schema
// ===========

export const ConfigNetworkSchemaCardano = new ConfigSchema({
  required: Type.Object({
    displayName: Type.String(),
    type: Type.Literal(ConfigNetworkType.CARDANO),
    network: CardanoNetwork,
  }),
  optional: Type.Object({}),
});
export type ConfigNetworkCardano = MergeIntersects<
  Static<ReturnType<typeof ConfigNetworkSchemaCardano.allProperties<true>>>
>;

// ===========
// Conversions
// ===========

// none
