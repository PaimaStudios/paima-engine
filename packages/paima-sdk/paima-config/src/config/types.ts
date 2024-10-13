import type { MergeIntersects } from '@paima/utils';
import { Static, StaticDecode } from '@sinclair/typebox';
import {
  ConfigFunnelAll,
  ConfigFunnelMain,
  ConfigFunnelParallel,
  ConfigNetworkAll,
  ConfigPrimitiveAll,
} from '../schema/index.js';
import { SecurityNamespace } from '../schema/namespace.js';
import { Chain, ChainFormatters } from 'viem';
import { ConfigFunnelDecorator } from '../schema/funnel/decorators/all.js';

export type NetworkConfig<RequireDefaults extends boolean = true> = MergeIntersects<
  Static<ReturnType<typeof ConfigNetworkAll<RequireDefaults>>>
>;
export type DeployedAddressConfig = Record<string, string>;

export type MainFunnelConfig<RequireDefaults extends boolean = true> = MergeIntersects<
  Static<ReturnType<typeof ConfigFunnelMain<RequireDefaults>>>
>;
export type ParallelFunnelConfig<RequireDefaults extends boolean = true> = MergeIntersects<
  Static<ReturnType<typeof ConfigFunnelParallel<RequireDefaults>>>
>;
export type DecoratorFunnelConfig<RequireDefaults extends boolean = true> = MergeIntersects<
  Static<ReturnType<typeof ConfigFunnelDecorator<RequireDefaults>>>
>;
export type FunnelConfig<RequireDefaults extends boolean = true> = MergeIntersects<
  Static<ReturnType<typeof ConfigFunnelAll<RequireDefaults>>>
>;

export type FunnelChildren = undefined | Record<string, FunnelInfoTree<any, FunnelConfig>>;
export type FunnelInfo<NetworkName extends string | undefined, Config extends FunnelConfig> = {
  network: NetworkName;
  config: Config;
};
export type FunnelInfoTree<
  Info extends FunnelInfo<any, FunnelConfig>,
  Children extends FunnelChildren,
> = Info & {
  children: Children;
};
export type FunnelInfoFlattened<
  Info extends FunnelInfo<any, FunnelConfig>,
  Parent extends undefined | string,
> = Info & {
  parent: Parent;
};

export type FlattenedFunnelTree<
  Tree extends Record<string, FunnelInfoTree<FunnelInfo<any, FunnelConfig>, any>>,
  Parent extends string | undefined = undefined,
> = {
  [Key in keyof Tree]: FunnelInfoFlattened<Tree[Key], Parent>;
} & {
  [Key in keyof Tree]: Tree[Key] extends { children: infer Children }
    ? Children extends Record<string, FunnelInfoTree<any, any>>
      ? Key extends string
        ? FlattenedFunnelTree<Children, Key>
        : {}
      : {}
    : {};
}[keyof Tree];

export type FunnelNames<
  Tree extends Record<string, FunnelInfoTree<FunnelInfo<any, FunnelConfig>, any>>,
> =
  | keyof Tree
  | (Tree[keyof Tree] extends { children: infer C }
      ? C extends Record<string, FunnelInfoTree<any, any>>
        ? FunnelNames<C>
        : never
      : never);

export type PrimitiveConfig = MergeIntersects<StaticDecode<typeof ConfigPrimitiveAll>>;
export type PrimitiveInfo<FunnelName, Config extends PrimitiveConfig> = {
  funnel: FunnelName;
  primitive: Config;
};

/// =================
/// Config Data Types
/// =================

export type NetworkList = Record<string, NetworkConfig>;
export type NetworkData<Networks extends NetworkList> = {
  networks: Networks;
};

export type DeployedAddressesList<Networks extends NetworkList> = Partial<
  Record<keyof Networks & string, DeployedAddressConfig>
>;
export type DeployedAddressesData<
  Networks extends NetworkList,
  DeployedAddresses extends DeployedAddressesList<Networks>,
> = {
  deployedAddresses: DeployedAddresses;
};

export type MainFunnel<NetworkNames extends string | undefined> = FunnelInfo<NetworkNames, any>;
export type SubFunnel<NetworkNames extends string | undefined> = Record<
  string,
  FunnelInfoTree<FunnelInfo<NetworkNames, any>, any>
>;
export type FunnelsList<
  NetworkNames extends string | undefined,
  Main extends MainFunnel<NetworkNames>,
  Sub extends SubFunnel<NetworkNames>,
> = Record<string, FunnelInfoTree<Main, Sub>>;
export type FunnelsData<
  NetworkNames extends string | undefined,
  Funnels extends FunnelsList<NetworkNames, MainFunnel<NetworkNames>, SubFunnel<NetworkNames>>,
> = {
  funnels: Funnels;
};

export type PrimitivesList<
  Networks extends NetworkList,
  Funnels extends FunnelsList<
    (keyof Networks & string) | undefined,
    MainFunnel<(keyof Networks & string) | undefined>,
    SubFunnel<(keyof Networks & string) | undefined>
  >,
> = Record<string, PrimitiveInfo<FunnelNames<Funnels>, PrimitiveConfig>>;
export type PrimitivesData<
  Networks extends NetworkList,
  Funnels extends FunnelsList<
    (keyof Networks & string) | undefined,
    MainFunnel<(keyof Networks & string) | undefined>,
    SubFunnel<(keyof Networks & string) | undefined>
  >,
  Primitives extends PrimitivesList<Networks, Funnels>,
> = {
  primitives: Primitives;
};

export type NamespaceData<Namespace extends SecurityNamespace> = {
  readonly securityNamespace: Namespace;
};

export type JsonConfigData<
  Networks extends NetworkList,
  DeployedAddresses extends DeployedAddressesList<Networks>,
  Funnels extends FunnelsList<
    (keyof Networks & string) | undefined,
    MainFunnel<(keyof Networks & string) | undefined>,
    SubFunnel<(keyof Networks & string) | undefined>
  >,
  Primitives extends PrimitivesList<Networks, Funnels>,
> = NetworkData<Networks> &
  DeployedAddressesData<Networks, DeployedAddresses> &
  FunnelsData<(keyof Networks & string) | undefined, Funnels> &
  PrimitivesData<Networks, Funnels, Primitives> &
  NamespaceData<SecurityNamespace>;

export type ViemMappingData<Networks extends NetworkList> = {
  viemMapping: Record<keyof Networks & string, Chain<ChainFormatters>>;
};

export type NonJsonConfigData<Networks extends NetworkList> = ViemMappingData<Networks>;

export type ConfigData<
  Networks extends NetworkList,
  DeployedAddresses extends DeployedAddressesList<Networks>,
  Funnels extends FunnelsList<
    (keyof Networks & string) | undefined,
    MainFunnel<(keyof Networks & string) | undefined>,
    SubFunnel<(keyof Networks & string) | undefined>
  >,
  Primitives extends PrimitivesList<Networks, Funnels>,
> = JsonConfigData<Networks, DeployedAddresses, Funnels, Primitives> & NonJsonConfigData<Networks>;
