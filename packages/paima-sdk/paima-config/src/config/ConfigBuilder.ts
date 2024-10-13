import { ConfigNetworkAll, MapNetworkTypes } from '../schema/index.js';
import { viemToConfigNetwork } from '../schema/index.js';
import type { Chain, ChainFormatters } from 'viem';
import type { MergeIntersects, NoUndefinedField } from '@paima/utils';
import { Value } from '@sinclair/typebox/value';
import type { SecurityNamespace } from '../schema/namespace.js';
import type {
  ConfigData,
  DeployedAddressConfig,
  DeployedAddressesList,
  FlattenedFunnelTree,
  FunnelConfig,
  FunnelInfo,
  FunnelInfoTree,
  FunnelsList,
  JsonConfigData,
  MainFunnel,
  NetworkConfig,
  NetworkList,
  PrimitiveConfig,
  PrimitiveInfo,
  PrimitivesList,
  SubFunnel,
  ViemMappingData,
} from './types.js';
import { FunnelConfigQuery } from './configQuery.js';

export type DeployedAddressGenerator<
  ConfigBuilder,
  Network,
  Deployments extends DeployedAddressConfig,
> = {
  network: (config: ConfigBuilder) => Network;
  deployments: (config: ConfigBuilder, network: Network) => Deployments;
};

export type FunnelsGenerator<ConfigBuilder, Tree> = {
  funnels: (config: ConfigBuilder) => Tree;
};

export type PrimitiveGenerator<
  ConfigBuilder extends { data: { funnels: any } },
  Network extends NetworkConfig,
  Funnel extends FunnelInfo<Network['displayName'], FunnelConfig>,
  Primitive,
> = {
  funnel: (
    config: ConfigBuilder,
    flattenedFunnels: FlattenedFunnelTree<ConfigBuilder['data']['funnels']>
  ) => Funnel;
  // TODO: the valid primitives should depend on the network
  primitive: (config: ConfigBuilder, network: Network, funnel: Funnel['config']) => Primitive;
};

// TODO: ideally we delete this
export let GlobalConfig: Readonly<
  ConfigData<
    NetworkList,
    DeployedAddressesList<NetworkList>,
    FunnelsList<
      (keyof NetworkList & string) | undefined,
      MainFunnel<(keyof NetworkList & string) | undefined>,
      SubFunnel<(keyof NetworkList & string) | undefined>
    >,
    PrimitivesList<
      NetworkList,
      FunnelsList<
        (keyof NetworkList & string) | undefined,
        MainFunnel<(keyof NetworkList & string) | undefined>,
        SubFunnel<(keyof NetworkList & string) | undefined>
      >
    >
  >
>;

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

export class ConfigBuilder<
  /* eslint-disable @typescript-eslint/ban-types */
  const Networks extends NetworkList = {},
  const DeployedAddresses extends DeployedAddressesList<Networks> = {},
  const Funnels extends FunnelsList<
    (keyof Networks & string) | undefined,
    MainFunnel<(keyof Networks & string) | undefined>,
    SubFunnel<(keyof Networks & string) | undefined>
  > = {},
  const Primitives extends PrimitivesList<Networks, Funnels> = {},
  const Namespace extends SecurityNamespace = '',
  /* eslint-enable @typescript-eslint/ban-types */
> {
  public data: ConfigData<Networks, DeployedAddresses, Funnels, Primitives>;

  constructor(init: { securityNamespace: Namespace }) {
    this.data = {
      networks: {} as Networks,
      viemMapping: {} as ViemMappingData<Networks>['viemMapping'],
      deployedAddresses: {} as DeployedAddresses,
      funnels: {} as Funnels,
      primitives: {} as Primitives,
      securityNamespace: init.securityNamespace,
    };
    // TODO: replace once TS5 decorators are better supported
    this.addNetwork.bind(this);
    this.registerDeployedContracts.bind(this);
    this.addFunnels.bind(this);
    this.addPrimitive.bind(this);
    this.exportConfig.bind(this);
    this.registerGlobal.bind(this);
  }

  addViemNetwork = <formatters extends ChainFormatters, const chain extends Chain<formatters>>(
    chain: chain
  ): ConfigBuilder<
    Networks & { [key in chain['name']]: MapNetworkTypes<chain> },
    DeployedAddresses,
    Funnels,
    Primitives,
    Namespace
  > => {
    const config = viemToConfigNetwork(chain);
    (this.data.viemMapping as any)[config.displayName] = chain;
    return this.addNetwork(config) as any;
  };
  addNetwork = <const Network extends NetworkConfig<false>>(
    network: Network
  ): ConfigBuilder<
    Networks & { [key in Network['displayName']]: MergeIntersects<Network & NetworkConfig<true>> },
    DeployedAddresses,
    Funnels,
    Primitives,
    Namespace
  > => {
    if (network.displayName in this.data.networks) {
      throw new Error(`Network ${network.displayName} is already included in your config`);
    }
    const withDefaults = Value.Default(ConfigNetworkAll(true), network);
    (this.data.networks as any)[network.displayName] = withDefaults;
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
    Primitives,
    Namespace
  > => {
    const network = generators.network(this);
    const deployments = generators.deployments(this, network);
    if (network.displayName in this.data.deployedAddresses) {
      throw new Error(
        `Contracts for network ${network.displayName} are already registered in your config`
      );
    }
    (this.data.deployedAddresses as any)[network.displayName] = deployments;
    return this as any;
  };

  addFunnels = <
    const Tree extends Record<
      string,
      FunnelInfoTree<FunnelInfo<(keyof Networks & string) | undefined, FunnelConfig>, any>
    >,
  >(
    generator: FunnelsGenerator<this, Tree>
  ): ConfigBuilder<
    Networks,
    DeployedAddresses,
    Tree,
    PrimitivesList<Networks, Tree>,
    Namespace
  > => {
    const tree = generator.funnels(this);
    (this.data.funnels as any) = tree;
    return this as any;
  };

  addPrimitive = <
    const Funnel extends NoUndefinedField<
      FunnelInfo<Extract<keyof Networks, string>, FunnelConfig>
    >,
    const Primitive extends PrimitiveConfig,
  >(
    generators: PrimitiveGenerator<this, Networks[Funnel['network']], Funnel, Primitive>
  ): ConfigBuilder<
    Networks,
    DeployedAddresses,
    Funnels,
    Primitives & {
      [key in Primitive['displayName']]: PrimitiveInfo<Funnel, Primitive>;
    },
    Namespace
  > => {
    const { config: funnel, network } = generators.funnel(
      this,
      FunnelConfigQuery.flattenTree(this.data.funnels)
    );
    if (network == null) {
      throw new Error('Cannot register a primitive to a funnel without a network');
    }
    const primitive = generators.primitive(this, this.data.networks[network], funnel);
    if (primitive.displayName in this.data.primitives) {
      throw new Error(`Primitive ${primitive.displayName} is already included in your config`);
    }
    (this.data.primitives[primitive.displayName] as any) = {
      funnel: funnel.displayName,
      primitive,
    };
    return this as any;
  };

  // ==============
  // Util functions
  // ==============

  registerGlobal = (): Readonly<ConfigData<Networks, DeployedAddresses, Funnels, Primitives>> => {
    const data = Object.freeze(this.data);
    GlobalConfig = data as any;
    return data;
  };

  /**
   * Export the configuration to easily see it as a JSON-like object
   */
  exportConfig = (): JsonConfigData<Networks, DeployedAddresses, Funnels, Primitives> => {
    return {
      networks: this.data.networks,
      deployedAddresses: this.data.deployedAddresses,
      funnels: this.data.funnels,
      primitives: this.data.primitives,
      securityNamespace: this.data.securityNamespace,
    };
  };
}

export type ChainInfo<Network extends NetworkConfig, Funnel extends FunnelConfig> = {
  network: Network;
  funnel: Funnel;
};
