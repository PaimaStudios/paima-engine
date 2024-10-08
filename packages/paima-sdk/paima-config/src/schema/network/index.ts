import { Type } from '@sinclair/typebox';
import type { ConfigNetworkType } from './types.js';
import { ConfigNetworkSchemaEvm } from './evm.js';
import type { ConfigNetworkEvm } from './evm.js';
export * from './evm.js';
export * from './types.js';

export type ConfigNetworkMapping = {
  [ConfigNetworkType.EVM]: ConfigNetworkEvm;
  // [ConfigNetworkType.CARDANO]: ConfigNetworkCardano;
  // [ConfigNetworkType.MINA]: ConfigNetworkMina;
  // [ConfigNetworkType.AVAIL]: ConfigNetworkAvail;
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const ConfigNetworkAll = <Bool extends boolean>(requireOptional: Bool) =>
  Type.Union([
    ConfigNetworkSchemaEvm.allProperties(requireOptional),
    // ConfigNetworkSchemaCardano.allProperties(requireOptional),
    // ConfigNetworkSchemaMina.allProperties(requireOptional),
    // ConfigNetworkSchemaAvail.allProperties(requireOptional),
  ]);
