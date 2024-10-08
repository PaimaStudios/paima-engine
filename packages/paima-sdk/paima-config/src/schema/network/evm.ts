import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';
import { ConfigSchema } from '../utils.js';

// ===========
// Base schema
// ===========

export const ConfigNetworkSchemaEvm = new ConfigSchema({
  required: Type.Object({
    displayName: Type.String(),
    chainId: Type.Number(),
    chainUri: Type.String(),
    chainCurrencyName: Type.String(),
    chainCurrencySymbol: Type.String(),
    chainCurrencyDecimals: Type.Number(),
  }),
  optional: Type.Object({
    chainExplorerUri: Type.String({ default: '' }),
  }),
});
export type ConfigNetworkEvm = Static<
  ReturnType<typeof ConfigNetworkSchemaEvm.allProperties<true>>
>;
