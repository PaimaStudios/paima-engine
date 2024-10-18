import type { MergeIntersects } from '@paima/utils';
import { ConfigNetworkType } from '../network/index.js';

export enum ConfigFunnelType {
  EVM_MAIN = 'evm-rpc-main',
  EVM_PARALLEL = 'evm-rpc-parallel',
  CARDANO_PARALLEL = 'cardano-carp-parallel',
  MINA_PARALLEL = 'mina-sql-parallel',
  AVAIL_MAIN = 'avail-rpc-main',
  AVAIL_PARALLEL = 'avail-rpc-parallel',
  MIDNIGHT_PARALLEL = 'midnight-graphql-parallel',
}

export const FunnelToNetwork = {
  [ConfigFunnelType.EVM_MAIN]: ConfigNetworkType.EVM,
  [ConfigFunnelType.EVM_PARALLEL]: ConfigNetworkType.EVM,
  [ConfigFunnelType.CARDANO_PARALLEL]: ConfigNetworkType.CARDANO,
  [ConfigFunnelType.MINA_PARALLEL]: ConfigNetworkType.MINA,
  [ConfigFunnelType.AVAIL_MAIN]: ConfigNetworkType.AVAIL,
  [ConfigFunnelType.AVAIL_PARALLEL]: ConfigNetworkType.AVAIL,
  [ConfigFunnelType.MIDNIGHT_PARALLEL]: ConfigNetworkType.MIDNIGHT,
} satisfies Record<ConfigFunnelType, ConfigNetworkType>;

export type NetworkFromFunnel<T extends ConfigFunnelType> = (typeof FunnelToNetwork)[T];

export type FunnelWithNetwork<Funnel extends { type: ConfigFunnelType }> = MergeIntersects<
  Funnel & {
    network: string;
  }
>;
