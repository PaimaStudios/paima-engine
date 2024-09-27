import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';
import { ConfigFunnelType } from './types.js';
import { ConfigSchema } from '../utils.js';

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
    paimaL2ContractAddress: Type.String(), // TODO: remove this and make it a primitive eventually
  }),
  optional: Type.Object({}),
});
export type ConfigFunnelEvmMain = Static<
  ReturnType<typeof ConfigFunnelSchemaEvmMain.allProperties<true>>
>;

// ==========================
// Variant 2: parallel config
// ==========================

export const ConfigFunnelSchemaEvmParallel = ConfigFunnelSchemaEvmBase.cloneMerge({
  required: Type.Object({
    type: Type.Literal(ConfigFunnelType.EVM_PARALLEL),
  }),
  optional: Type.Object({
    delay: Type.Number(),
    confirmationDepth: Type.Number(),
  }),
});
export type ConfigFunnelEvmParallel = Static<
  ReturnType<typeof ConfigFunnelSchemaEvmParallel.allProperties<true>>
>;
