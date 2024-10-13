import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';
import { ConfigFunnelType } from './types.js';
import { ConfigSchema } from '../utils.js';
import { waitingPeriodFromDepth } from './common.js';
import { MergeIntersects } from '@paima/utils';

// ===========
// Base schema
// ===========

export const ConfigFunnelSchemaMinaBase = new ConfigSchema({
  required: Type.Object({
    displayName: Type.String(),
    archiveConnectionString: Type.String(),
  }),
  optional: Type.Object({
    presyncStepSize: Type.Number({ default: 1000 }),
    paginationLimit: Type.Number({ default: 50 }),
  }),
});

// ==========================
// Variant 2: parallel config
// ==========================

const blockTime = 3 * 60 * 1000; // 3 minutes
/**
 * Mina has probabilistic finality, and rollbacks take 290 blocks to avoid
 * since that's not realistic, we just arbitrarily pick 2 blocks
 */
const finalityDepth = 2;

export const ConfigFunnelSchemaMinaParallel = ConfigFunnelSchemaMinaBase.cloneMerge({
  required: Type.Object({
    type: Type.Literal(ConfigFunnelType.MINA_PARALLEL),
  }),
  optional: Type.Object({
    // blocks are only approximately, but could be much longer so we add an extra delay
    ...waitingPeriodFromDepth(finalityDepth, blockTime, { factor: 2, absolute: 0 }),
  }),
});
export type ConfigFunnelMinaParallel = MergeIntersects<
  Static<ReturnType<typeof ConfigFunnelSchemaMinaParallel.allProperties<true>>>
>;
