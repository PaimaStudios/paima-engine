import { Static } from '@sinclair/typebox';
import { MergeIntersects } from '@paima/utils';
import assertNever from 'assert-never';
import { toChainId, registry } from '@dcspark/cip34-js';
import { ConfigNetworkType } from './types.js';
import { ConfigNetworkAll } from './all.js';

function networkToCip34(
  config: MergeIntersects<
    Static<ReturnType<typeof ConfigNetworkAll<true>>> & { type: ConfigNetworkType.CARDANO }
  >
): string {
  switch (config.network) {
    case 'mainnet':
      return toChainId({
        networkId: registry.Mainnet.NetworkId,
        networkMagic: registry.Mainnet.NetworkMagic,
      });
    case 'preprod':
      return toChainId({
        networkId: registry.PreProduction.NetworkId,
        networkMagic: registry.PreProduction.NetworkMagic,
      });
    case 'preview':
      return toChainId({
        networkId: registry.Preview.NetworkId,
        networkMagic: registry.Preview.NetworkMagic,
      });
    default:
      assertNever.default(config.network);
  }
}

export function caip2PrefixFor(
  config: MergeIntersects<Static<ReturnType<typeof ConfigNetworkAll<false>>>>
): string {
  const type = config.type;

  switch (type) {
    case ConfigNetworkType.EVM:
      return `eip155:${config.chainId}`;
    case ConfigNetworkType.MINA:
      return `mina:${config.networkId}`;
    case ConfigNetworkType.CARDANO:
      return networkToCip34(config);
    case ConfigNetworkType.AVAIL:
      return `polkadot:${config.genesisHash.slice(2, 32 + 2)}`;
    case ConfigNetworkType.MIDNIGHT:
      return `midnight:${config.networkId}`;
    default:
      assertNever.default(type);
  }
}
