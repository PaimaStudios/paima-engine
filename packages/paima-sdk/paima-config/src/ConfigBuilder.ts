import type { Static, StaticDecode } from '@sinclair/typebox';
import type { ConfigNetworkAll } from './schema/index.js';
import type { ConfigFunnelAll } from './schema/index.js';
import type { ConfigPrimitiveAll } from './schema/index.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

export type NetworkConfig = Static<ReturnType<typeof ConfigNetworkAll<false>>>;
export type DeployedAddressConfig = Record<string, string>;
export type FunnelConfig = Static<ReturnType<typeof ConfigFunnelAll<false>>>;
export type FunnelInfo<NetworkName, Config extends FunnelConfig> = {
  network: NetworkName;
  config: Config;
};
export type PrimitiveConfig = StaticDecode<typeof ConfigPrimitiveAll>;
export type PrimitiveInfo<FunnelName, Config extends PrimitiveConfig> = {
  funnel: FunnelName;
  primitive: Config;
};

export type DeployedAddressGenerator<ConfigBuilder, Network, Deployments extends DeployedAddressConfig> = {
  network: (config: ConfigBuilder) => Network;
  deployments: (config: ConfigBuilder, network: Network) => Deployments;
};

export type FunnelGenerator<ConfigBuilder, Network, Funnel extends FunnelConfig> = {
  network: (config: ConfigBuilder) => Network;
  // TODO: the valid funnels should depend on the network
  funnel: (config: ConfigBuilder, network: Network) => Funnel;
}

export type PrimitiveGenerator<ConfigBuilder, Network extends NetworkConfig, Funnel extends FunnelInfo<Network['displayName'], FunnelConfig>, Primitive> = {
  funnel: (config: ConfigBuilder) => Funnel,
  // TODO: the valid primitives should depend on the network
  primitive: (
    config: ConfigBuilder,
    network: Network,
    funnel: Funnel['config']
  ) => Primitive
}
export class ConfigBuilder<
  /* eslint-disable @typescript-eslint/ban-types */
  const Networks extends Record<string, NetworkConfig> = {},
  const DeployedAddresses extends Partial<Record<keyof Networks, DeployedAddressConfig>> = {},
  const Funnels extends Record<string, FunnelInfo<keyof Networks, FunnelConfig>> = {},
  const Primitives extends Record<string, PrimitiveInfo<keyof Funnels, PrimitiveConfig>> = {},
  /* eslint-enable @typescript-eslint/ban-types */
> {
  networks: Networks = {} as Networks;
  deployedAddresses: DeployedAddresses = {} as DeployedAddresses;
  funnels: Funnels = {} as Funnels;
  primitives: Primitives = {} as Primitives;

  constructor() {
    // TODO: replace once TS5 decorators are better supported
    this.addNetwork.bind(this);
    this.registerDeployedContracts.bind(this);
    this.addFunnel.bind(this);
    this.addPrimitive.bind(this);
    this.exportConfig.bind(this);
  }

  addNetwork = <const Network extends NetworkConfig>(
    network: Network
  ): ConfigBuilder<
    Networks & { [key in Network['displayName']]: typeof network },
    DeployedAddresses,
    Funnels,
    Primitives
  > => {
    if (network.displayName in this.networks) {
      throw new Error(`Network ${network.displayName} is already included in your config`);
    }
    (this.networks as any)[network.displayName] = network;
    return this as any;
  };

  registerDeployedContracts = <
    const Network extends Networks[keyof Networks],
    const Deployments extends Record<string, string>,
  >(
    generators: DeployedAddressGenerator<this, Network, Deployments>
  ): ConfigBuilder<
    Networks,
    DeployedAddresses & {
      [key in Network['displayName']]: Deployments;
    },
    Funnels,
    Primitives
  > => {
    const network = generators.network(this);
    const deployments = generators.deployments(this, network);
    if (network.displayName in this.deployedAddresses) {
      throw new Error(
        `Contracts for network ${network.displayName} are already registered in your config`
      );
    }
    (this.deployedAddresses as any)[network.displayName] = deployments;
    return this as any;
  };

  addFunnel = <const Network extends Networks[keyof Networks], const Funnel extends FunnelConfig>(
    generators: FunnelGenerator<this, Network, Funnel>
  ): ConfigBuilder<
    Networks,
    DeployedAddresses,
    Funnels & {
      [key in Funnel['displayName']]: FunnelInfo<Network['displayName'], Funnel>;
    },
    Primitives
  > => {
    const network = generators.network(this);
    const funnel = generators.funnel(this, network);
    if (funnel.displayName in this.funnels) {
      throw new Error(`Funnel ${funnel.displayName} is already included in your config`);
    }
    (this.funnels[funnel.displayName] as any) = {
      network: network.displayName,
      config: funnel,
    };
    return this as any;
  };

  addPrimitive = <
    const Funnel extends FunnelInfo<Extract<keyof Networks, string>, FunnelConfig>,
    const Primitive extends PrimitiveConfig,
  >(generators: PrimitiveGenerator<this, Networks[Funnel['network']], Funnel,Primitive>): ConfigBuilder<
    Networks,
    DeployedAddresses,
    Funnels,
    Primitives & {
      [key in Primitive['displayName']]: PrimitiveInfo<Funnel, Primitive>;
    }
  > => {
    const { config: funnel, network } = generators.funnel(this);
    const primitive = generators.primitive(this, this.networks[network], funnel);
    if (primitive.displayName in this.primitives) {
      throw new Error(`Primitive ${primitive.displayName} is already included in your config`);
    }
    (this.primitives[primitive.displayName] as any) = {
      funnel: funnel.displayName,
      primitive,
    };
    return this as any;
  };

  exportConfig(): {
    networks: Networks;
    deployedAddresses: DeployedAddresses;
    funnels: Funnels;
    primitives: Primitives;
  } {
    return {
      networks: this.networks,
      deployedAddresses: this.deployedAddresses,
      funnels: this.funnels,
      primitives: this.primitives,
    };
  }
}
