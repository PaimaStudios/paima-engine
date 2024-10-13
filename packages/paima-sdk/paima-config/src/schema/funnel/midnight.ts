import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';
import { ConfigFunnelType } from './types.js';
import { ConfigSchema } from '../utils.js';
import { waitingPeriodFromDepth } from './common.js';
import { MergeIntersects, TypeboxHelpers } from '@paima/utils';

// ===========
// Base schema
// ===========

export const ConfigFunnelSchemaMidnightBase = new ConfigSchema({
  required: Type.Object({
    displayName: Type.String(),
    indexer: Type.String(),
    // note: node URL and proof server are not needed for read-only use
  }),
  optional: Type.Object({
    indexerWS: TypeboxHelpers.Nullable(Type.String(), { default: null }),
    presyncStepSize: Type.Number({ default: 1000 }),
    paginationLimit: Type.Number({ default: 50 }),
  }),
});

// ==========================
// Variant2: parallel config
// ==========================

const blockTime = 6 * 1000; // 6 seconds
/**
 * finality is "2~3 blocks", so we pick the larger of the two
 */
const finalityDepth = 3;

export const ConfigFunnelSchemaMidnightParallel = ConfigFunnelSchemaMidnightBase.cloneMerge({
  required: Type.Object({
    type: Type.Literal(ConfigFunnelType.MIDNIGHT_PARALLEL),
  }),
  optional: Type.Object({
    ...waitingPeriodFromDepth(finalityDepth, blockTime, { absolute: 2 * 1000 }),
  }),
});
export type ConfigFunnelMidnightParallel = MergeIntersects<
  Static<ReturnType<typeof ConfigFunnelSchemaMidnightParallel.allProperties<true>>>
>;
