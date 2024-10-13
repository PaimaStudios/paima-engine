import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';
import { ConfigFunnelType } from './types.js';
import { ConfigSchema } from '../utils.js';
import { waitingPeriodFromDepth } from './common.js';
import { MergeIntersects } from '@paima/utils';

// ===========
// Base schema
// ===========

export const ConfigFunnelSchemaAvailBase = new ConfigSchema({
  required: Type.Object({
    displayName: Type.String(),
    rpc: Type.String(),
    lightClient: Type.String(),
  }),
  optional: Type.Object({
    funnelBlockGroupSize: Type.Number({ default: 100 }),
    presyncStepSize: Type.Number({ default: 1000 }),
  }),
});

// ======================
// Variant 1: main config
// ======================

export const ConfigFunnelSchemaAvailMain = ConfigFunnelSchemaAvailBase.cloneMerge({
  required: Type.Object({
    type: Type.Literal(ConfigFunnelType.AVAIL_MAIN),
  }),
  optional: Type.Object({}),
});
export type ConfigFunnelAvailMain = MergeIntersects<
  Static<ReturnType<typeof ConfigFunnelSchemaAvailMain.allProperties<true>>>
>;

// ==========================
// Variant 2: parallel config
// ==========================

const blockTimeMs = 20 * 1000; // 20 seconds
/**
 * Finality is probabilistic, but it's ~3 blocks (60s)
 */
const finalityDepth = 3; // 3 blocks

export const ConfigFunnelSchemaAvailParallel = ConfigFunnelSchemaAvailBase.cloneMerge({
  required: Type.Object({
    type: Type.Literal(ConfigFunnelType.AVAIL_PARALLEL),
  }),
  optional: Type.Object({
    ...waitingPeriodFromDepth(finalityDepth, blockTimeMs, { absolute: blockTimeMs }),
  }),
});
export type ConfigFunnelAvailParallel = MergeIntersects<
  Static<ReturnType<typeof ConfigFunnelSchemaAvailParallel.allProperties<true>>>
>;
