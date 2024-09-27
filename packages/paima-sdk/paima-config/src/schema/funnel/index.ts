import { Type } from '@sinclair/typebox';
import type { ConfigFunnelType } from './types.js';
import { ConfigFunnelSchemaEvmMain, ConfigFunnelSchemaEvmParallel } from './evm.js';
import type { ConfigFunnelEvmMain, ConfigFunnelEvmParallel } from './evm.js';
export * from './evm.js';
export * from './types.js';

export type ConfigFunnelMapping = {
  [ConfigFunnelType.EVM_MAIN]: ConfigFunnelEvmMain;
  [ConfigFunnelType.EVM_PARALLEL]: ConfigFunnelEvmParallel;
  // [ConfigFunnelType.CARDANO_PARALLEL]: ConfigFunnelCardanoParallel;
  // [ConfigFunnelType.MINA_PARALLEL]: ConfigFunnelMinaParallel;
  // [ConfigFunnelType.AVAIL_MAIN]: ConfigFunnelAvailMain;
  // [ConfigFunnelType.AVAIL_PARALLEL]: ConfigFunnelAvailParallel;
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const ConfigFunnelAll = <Bool extends boolean>(requireOptional: Bool) =>
  Type.Union([
    ConfigFunnelSchemaEvmMain.allProperties(requireOptional),
    ConfigFunnelSchemaEvmParallel.allProperties(requireOptional),
    // ConfigFunnelSchemaCardano.allProperties(requireOptional),
    // ConfigFunnelSchemaMina.allProperties(requireOptional),
    // ConfigFunnelSchemaAvail.allProperties(requireOptional),
  ]);
