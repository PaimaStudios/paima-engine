import type { Static, StaticDecode } from '@sinclair/typebox';
import type { ConfigNetworkAll } from './schema/index.js';
import type { ConfigFunnelAll } from './schema/index.js';
import type { ConfigPrimitiveAll } from './schema/index.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

type NetworkConfig = Static<ReturnType<typeof ConfigNetworkAll<false>>>;
type DeployedAddressConfig = Record<string, string>;
type FunnelConfig = Static<ReturnType<typeof ConfigFunnelAll<false>>>;
type FunnelInfo<Networks, Config extends FunnelConfig> = {
  network: Networks;
  config: Config;
};
type PrimitiveConfig = StaticDecode<typeof ConfigPrimitiveAll>;
type PrimitiveInfo<Funnels, Config extends PrimitiveConfig> = {
  funnel: Funnels;
  primitive: Config;
};

type DeployedAddressConfigHolder<Network, Deployments extends DeployedAddressConfig> = {
  network: Network;
  deployments: Deployments;
};
type FunnelConfigHolder<Network, Funnel extends FunnelConfig> = {
  network: Network;
  // TODO: the valid funnels should depend on the network
  funnel: (network: Network) => Funnel;
};
type PrimitiveConfigHolder<
  Network extends NetworkConfig,
  Funnel extends FunnelInfo<Network['displayName'], FunnelConfig>,
  Primitive extends PrimitiveConfig,
> = {
  funnel: Funnel;
  // TODO: the valid primitives should depend on the network
  primitive: (network: Network, funnel: Funnel['config']) => Primitive;
};

export class ConfigBuilder<
  const Networks extends Record<string, NetworkConfig> = {},
  const DeployedAddresses extends Partial<Record<keyof Networks, DeployedAddressConfig>> = {},
  const Funnels extends Record<string, FunnelInfo<keyof Networks, FunnelConfig>> = {},
  const Primitives extends Record<string, PrimitiveInfo<keyof Funnels, PrimitiveConfig>> = {},
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
    this.toJson.bind(this);
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
    addAddresses: (config: this) => DeployedAddressConfigHolder<Network, Deployments>
  ): ConfigBuilder<
    Networks,
    DeployedAddresses & {
      [key in Network['displayName']]: DeployedAddressConfigHolder<
        Network,
        Deployments
      >['deployments'];
    },
    Funnels,
    Primitives
  > => {
    const addresses = addAddresses(this);
    if (addresses.network.displayName in this.deployedAddresses) {
      throw new Error(
        `Contracts for network ${addresses.network.displayName} are already registered in your config`
      );
    }
    (this.deployedAddresses as any)[addresses.network.displayName] = addresses.deployments;
    return this as any;
  };

  addFunnel = <const Network extends Networks[keyof Networks], const Funnel extends FunnelConfig>(
    addFunnel: (config: this) => FunnelConfigHolder<Network, Funnel>
  ): ConfigBuilder<
    Networks,
    DeployedAddresses,
    Funnels & {
      [key in Funnel['displayName']]: FunnelInfo<Network['displayName'], Funnel>;
    },
    Primitives
  > => {
    const funnelHolder = addFunnel(this);
    const funnel = funnelHolder.funnel(funnelHolder.network);
    if (funnel.displayName in this.funnels) {
      throw new Error(`Funnel ${funnel.displayName} is already included in your config`);
    }
    (this.funnels[funnel.displayName] as any) = {
      network: funnelHolder.network.displayName,
      config: funnel,
    };
    return this as any;
  };

  addPrimitive = <
    const Network extends Extract<keyof Networks, string>,
    const Funnel extends FunnelInfo<Network, FunnelConfig>,
    const Primitive extends PrimitiveConfig,
  >(
    genFunnel: (config: this) => Funnel,
    // TODO: the valid primitives should depend on the network
    genPrimitive: (
      config: this,
      network: Networks[Extract<keyof Networks, string>],
      funnel: Funnel['config']
    ) => Primitive
  ): ConfigBuilder<
    Networks,
    DeployedAddresses,
    Funnels,
    Primitives & {
      [key in Primitive['displayName']]: PrimitiveInfo<Funnel, Primitive>;
    }
  > => {
    const { config: funnel, network } = genFunnel(this);
    const primitive = genPrimitive(this, this.networks[network], funnel);
    if (primitive.displayName in this.primitives) {
      throw new Error(`Primitive ${primitive.displayName} is already included in your config`);
    }
    (this.primitives[primitive.displayName] as any) = {
      funnel: funnel.displayName,
      primitive,
    };
    return this as any;
  };

  toJson(): string {
    return JSON.stringify({
      network: this.networks,
      deployedAddresses: this.deployedAddresses,
      funnels: this.funnels,
      primitives: this.primitives,
    });
  }
}
