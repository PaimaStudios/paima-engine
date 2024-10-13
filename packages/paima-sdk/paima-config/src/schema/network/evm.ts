import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';
import { ConfigSchema } from '../utils.js';
import { ConfigNetworkType } from './types.js';
import { MergeIntersects, TypeboxHelpers } from '@paima/utils';
import { Chain, ChainFormatters } from 'viem';

// =====
// Utils
// =====

export const BlockExplorer = Type.Object({
  name: Type.String(),
  url: Type.String(),
  apiUrl: Type.Optional(Type.String()),
});
export const RpcUrls = Type.Const(
  Type.Object({
    http: Type.Array(Type.String()),
    webSocket: Type.Optional(Type.Array(Type.String())),
  })
);
export const ChainNativeCurrency = Type.Object({
  name: Type.String(),
  symbol: Type.String({ minLength: 2, maxLength: 6 }),
  decimals: Type.Number(),
});

// ===========
// Base schema
// ===========

export const ConfigNetworkSchemaEvm = new ConfigSchema({
  required: Type.Object({
    displayName: Type.String(),
    type: Type.Literal(ConfigNetworkType.EVM),
    chainId: Type.Number(),
    nativeCurrency: ChainNativeCurrency,
    rpcUrls: Type.Object(
      {
        default: RpcUrls,
      },
      { additionalProperties: true }
    ),
  }),
  optional: Type.Object({
    blockExplorers: TypeboxHelpers.Nullable(
      Type.Record(Type.String(), BlockExplorer, { additionalProperties: true }),
      { default: null }
    ),
    /** Source Chain ID (ie. the L1 chain) */
    sourceId: TypeboxHelpers.Nullable(Type.Number(), { default: null }),
    testnet: Type.Boolean({ default: false }),
  }),
});
export type ConfigNetworkEvm = MergeIntersects<
  Static<ReturnType<typeof ConfigNetworkSchemaEvm.allProperties<true>>>
>;

// ===========
// Conversions
// ===========

export type MapNetworkTypes<chain extends Chain<ChainFormatters>> = Omit<chain, 'name' | 'id'> & {
  chainId: chain['id'];
  displayName: chain['name'];
};

export function viemToConfigNetwork(chain: Chain<ChainFormatters>): ConfigNetworkEvm {
  const network = {
    ...chain,
    type: ConfigNetworkType.EVM as const,
    displayName: chain.name,
    chainId: chain.id,
    blockExplorers: chain.blockExplorers ?? null,
    sourceId: chain.sourceId ?? null,
    testnet: chain.testnet ?? false,
  };
  return network;
}
