import { Type } from '@sinclair/typebox';
import { ConfigSchema } from '../../utils.js';
import { ConfigFunnelDecoratorType } from './types.js';

export const ConfigFunnelSchemaEmulated = new ConfigSchema({
  required: Type.Object({
    displayName: Type.String(),
    blockTimeMs: Type.Number(),
    type: Type.Literal(ConfigFunnelDecoratorType.EMULATED),
  }),
  optional: Type.Object({}),
});
