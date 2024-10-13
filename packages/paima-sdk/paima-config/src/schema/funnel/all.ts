import { Type } from '@sinclair/typebox';
import { ConfigFunnelType } from './types.js';
import { ConfigFunnelSchemaEvmMain, ConfigFunnelSchemaEvmParallel } from './evm.js';
import { ConfigFunnelSchemaCardanoParallel } from './cardano.js';
import { ConfigFunnelSchemaMinaParallel } from './mina.js';
import { ConfigFunnelSchemaAvailMain, ConfigFunnelSchemaAvailParallel } from './avail.js';
import { ConfigFunnelSchemaMidnightParallel } from './midnight.js';
import type { ToMapping } from '../utils.js';
import { ConfigFunnelDecorator } from './decorators/all.js';

export const mainFunnelTypes = {
  [ConfigFunnelType.EVM_MAIN]: ConfigFunnelSchemaEvmMain,
  [ConfigFunnelType.AVAIL_MAIN]: ConfigFunnelSchemaAvailMain,
} as const;

export type ConfigFunnelMappingMain = ToMapping<ConfigFunnelType, typeof mainFunnelTypes>;

export const parallelFunnelTypes = {
  [ConfigFunnelType.EVM_PARALLEL]: ConfigFunnelSchemaEvmParallel,
  [ConfigFunnelType.CARDANO_PARALLEL]: ConfigFunnelSchemaCardanoParallel,
  [ConfigFunnelType.MINA_PARALLEL]: ConfigFunnelSchemaMinaParallel,
  [ConfigFunnelType.AVAIL_PARALLEL]: ConfigFunnelSchemaAvailParallel,
  [ConfigFunnelType.MIDNIGHT_PARALLEL]: ConfigFunnelSchemaMidnightParallel,
} as const;

export type ConfigFunnelMappingParallel = ToMapping<ConfigFunnelType, typeof parallelFunnelTypes>;

export type ConfigFunnelMapping = ConfigFunnelMappingMain & ConfigFunnelMappingParallel;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const ConfigFunnelMain = <Bool extends boolean>(requireOptional: Bool) =>
  Type.Union(Object.values(mainFunnelTypes).map(schema => schema.allProperties(requireOptional)));
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const ConfigFunnelParallel = <Bool extends boolean>(requireOptional: Bool) =>
  Type.Union(
    Object.values(parallelFunnelTypes).map(schema => schema.allProperties(requireOptional))
  );

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const ConfigFunnelAll = <Bool extends boolean>(requireOptional: Bool) =>
  Type.Union([
    ConfigFunnelMain(requireOptional),
    ConfigFunnelParallel(requireOptional),
    ConfigFunnelDecorator(requireOptional),
  ]);
