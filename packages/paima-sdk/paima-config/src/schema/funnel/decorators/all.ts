import { Type } from '@sinclair/typebox';
import { ConfigFunnelDecoratorType } from './types.js';
import type { ToMapping } from '../../utils.js';
import { ConfigFunnelSchemaEmulated } from './emulated.js';

export const decoratorFunnelTypes = {
  [ConfigFunnelDecoratorType.EMULATED]: ConfigFunnelSchemaEmulated,
} as const;

export type AllDecorators = (typeof decoratorFunnelTypes)[keyof typeof decoratorFunnelTypes];
export type ConfigFunnelMappingDecorator = ToMapping<
  ConfigFunnelDecoratorType,
  typeof decoratorFunnelTypes
>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const ConfigFunnelDecorator = <Bool extends boolean>(requireOptional: Bool) =>
  Type.Union(
    Object.values(decoratorFunnelTypes).map(schema => schema.allProperties(requireOptional))
  );
