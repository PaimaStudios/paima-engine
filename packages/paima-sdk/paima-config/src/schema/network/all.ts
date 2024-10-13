import { ConfigNetworkSchemaEvm } from './evm.js';
import { ConfigNetworkSchemaCardano } from './cardano.js';
import { ConfigNetworkSchemaMina } from './mina.js';
import { ConfigNetworkSchemaAvail } from './avail.js';
import { ConfigNetworkSchemaMidnight } from './midnight.js';
import { ConfigNetworkType } from './types.js';
import { Type } from '@sinclair/typebox';
import type { ToMapping } from '../utils.js';

const networkTypes = {
  [ConfigNetworkType.EVM]: ConfigNetworkSchemaEvm,
  [ConfigNetworkType.CARDANO]: ConfigNetworkSchemaCardano,
  [ConfigNetworkType.MINA]: ConfigNetworkSchemaMina,
  [ConfigNetworkType.AVAIL]: ConfigNetworkSchemaAvail,
  [ConfigNetworkType.MIDNIGHT]: ConfigNetworkSchemaMidnight,
} as const;

export type ConfigNetworkMapping = ToMapping<ConfigNetworkType, typeof networkTypes>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const ConfigNetworkAll = <Bool extends boolean>(requireOptional: Bool) =>
  Type.Union(Object.values(networkTypes).map(schema => schema.allProperties(requireOptional)));
