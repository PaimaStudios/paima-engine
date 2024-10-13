import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';
import { ConfigFunnelType } from './types.js';
import { ConfigSchema } from '../utils.js';
import { MergeIntersects, TypeboxHelpers } from '@paima/utils';

// ===========
// Base schema
// ===========

export const ConfigFunnelSchemaEvmBase = new ConfigSchema({
  required: Type.Object({
    displayName: Type.String(),
    chainUri: Type.String(),
    blockTime: Type.Number(),
  }),
  optional: Type.Object({
    funnelBlockGroupSize: Type.Number({ default: 100 }),
    presyncStepSize: Type.Number({ default: 1000 }),
  }),
});

// ======================
// Variant 1: main config
// ======================

export const ConfigFunnelSchemaEvmMain = ConfigFunnelSchemaEvmBase.cloneMerge({
  required: Type.Object({
    type: Type.Literal(ConfigFunnelType.EVM_MAIN),
    // TODO: remove this and make it a primitive eventually
    paimaL2ContractAddress: TypeboxHelpers.EvmAddress,
  }),
  optional: Type.Object({}),
});
export type ConfigFunnelEvmMain = MergeIntersects<
  Static<ReturnType<typeof ConfigFunnelSchemaEvmMain.allProperties<true>>>
>;

// ==========================
// Variant 2: parallel config
// ==========================

export const ConfigFunnelSchemaEvmParallel = ConfigFunnelSchemaEvmBase.cloneMerge({
  required: Type.Object({
    type: Type.Literal(ConfigFunnelType.EVM_PARALLEL),
    confirmationDepth: Type.Number(),
  }),
  optional: Type.Object({
    delayMs: Type.Number({ default: 2 * 1000 }),
  }),
});
export type ConfigFunnelEvmParallel = MergeIntersects<
  Static<ReturnType<typeof ConfigFunnelSchemaEvmParallel.allProperties<true>>>
>;
