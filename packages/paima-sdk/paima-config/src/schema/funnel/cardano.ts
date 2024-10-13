import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';
import { ConfigFunnelType } from './types.js';
import { ConfigSchema } from '../utils.js';
import { waitingPeriodFromDepth } from './common.js';
import { MergeIntersects } from '@paima/utils';

// ===========
// Base schema
// ===========

export const ConfigFunnelSchemaCardanoBase = new ConfigSchema({
  required: Type.Object({
    displayName: Type.String(),
    carpUrl: Type.String(),
  }),
  optional: Type.Object({
    presyncStepSize: Type.Number({ default: 1000 }),
    paginationLimit: Type.Number({ default: 50 }),
  }),
});

// ==========================
// Variant2: parallel config
// ==========================

/**
 * Cardano block times are not deterministic, but it's approximately 20 seconds
 */
const blockTimeMs = 20 * 1000;
/**
 * Cardano has probabilistic finality, and rollbacks take "k" (1 day) to avoid
 * since that's not realistic, we just arbitrarily pick 5 blocks
 */
const finalityDepth = 5;

export const ConfigFunnelSchemaCardanoParallel = ConfigFunnelSchemaCardanoBase.cloneMerge({
  required: Type.Object({
    type: Type.Literal(ConfigFunnelType.CARDANO_PARALLEL),
  }),
  optional: Type.Object({
    // blocks are only approximately, but could be much longer so we add an extra delay
    ...waitingPeriodFromDepth(finalityDepth, blockTimeMs, { factor: 2, absolute: 0 }),
  }),
});
export type ConfigFunnelCardanoParallel = MergeIntersects<
  Static<ReturnType<typeof ConfigFunnelSchemaCardanoParallel.allProperties<true>>>
>;
