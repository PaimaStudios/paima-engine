/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { MergeIntersects } from '@paima/utils';
import {
  DecoratorFunnelConfig,
  DeployedAddressesData,
  DeployedAddressesList,
  FunnelConfig,
  FunnelInfo,
  FunnelInfoTree,
  MainFunnelConfig,
  NetworkData,
  NetworkList,
  ParallelFunnelConfig,
} from './types.js';
import { Value } from '@sinclair/typebox/value';
import { ConfigFunnelAll } from '../schema/index.js';

type PreFunnelData<
  Networks extends NetworkList,
  DeployedAddresses extends DeployedAddressesList<Networks>,
> = NetworkData<Networks> & DeployedAddressesData<Networks, DeployedAddresses>;

export type FunnelGenerator<
  Networks extends NetworkList,
  Network extends Networks[keyof Networks],
  DeployedAddresses extends DeployedAddressesList<Networks>,
  Funnel extends FunnelConfig<false>,
> = {
  network: (config: PreFunnelData<Networks, DeployedAddresses>) => Network;
  // TODO: the valid funnels should depend on the network
  funnel: (config: PreFunnelData<Networks, DeployedAddresses>, network: Network) => Funnel;
};

export type FunnelDecoratorGenerator<
  Networks extends NetworkList,
  DeployedAddresses extends DeployedAddressesList<Networks>,
  CurrentTopFunnel extends FunnelInfo<keyof Networks & string, FunnelConfig>,
  WrapperFunnel extends DecoratorFunnelConfig<false>,
> = {
  funnel: (
    config: PreFunnelData<Networks, DeployedAddresses>,
    topFunnel: CurrentTopFunnel
  ) => WrapperFunnel;
};

type BuiltFunnel<Funnel extends undefined | FunnelInfoTree<FunnelInfo<any, FunnelConfig>, any>> =
  Funnel extends FunnelInfoTree<FunnelInfo<any, FunnelConfig>, any>
    ? Record<Funnel['config']['displayName'] & string, Funnel>
    : never;

type SubFunnelList<Networks> = Record<string, FunnelInfo<keyof Networks & string, FunnelConfig>>;

type TopFunnel<
  Networks extends NetworkList,
  MainFunnel,
  SubFunnels extends SubFunnelList<Networks>,
  Wrapper extends undefined | FunnelInfoTree<FunnelInfo<any, FunnelConfig>, any>,
> =
  Wrapper extends FunnelInfoTree<FunnelInfo<any, FunnelConfig>, any>
    ? Wrapper
    : MainFunnel extends FunnelInfo<keyof Networks & string, FunnelConfig>
      ? FunnelInfoTree<MainFunnel, SubFunnels>
      : never;

export class FunnelConfigBuilder<
  /* eslint-disable @typescript-eslint/ban-types */
  const Networks extends NetworkList,
  const DeployedAddresses extends DeployedAddressesList<Networks>,
  const MainFunnel extends
    | undefined
    | FunnelInfo<keyof Networks & string, FunnelConfig> = undefined,
  const SubFunnels extends SubFunnelList<Networks> = {},
  const Wrapper extends undefined | FunnelInfoTree<FunnelInfo<any, FunnelConfig>, any> = undefined,
  /* eslint-enable @typescript-eslint/ban-types */
> {
  public wrapperFunnel: Wrapper = undefined as Wrapper;
  public mainFunnel: MainFunnel = undefined as MainFunnel;
  public subFunnels: SubFunnels = {} as SubFunnels;

  constructor(private readonly preFunnelData: PreFunnelData<Networks, DeployedAddresses>) {
    // TODO: replace once TS5 decorators are better supported
    this.addMainFunnel.bind(this);
    this.addParallelFunnel.bind(this as any);
    this.wrapWith.bind(this);
    this.build.bind(this);
  }

  wrapWith = <const Funnel extends DecoratorFunnelConfig<false>>(
    generators: FunnelDecoratorGenerator<
      Networks,
      DeployedAddresses,
      TopFunnel<Networks, MainFunnel, SubFunnels, Wrapper>,
      Funnel
    >
  ): FunnelConfigBuilder<
    Networks,
    DeployedAddresses,
    MainFunnel,
    SubFunnels,
    FunnelInfo<undefined, MergeIntersects<Funnel & DecoratorFunnelConfig<true>>> & {
      children: BuiltFunnel<TopFunnel<Networks, MainFunnel, SubFunnels, Wrapper>>;
    }
  > => {
    if (this.mainFunnel == null) {
      throw new Error('Cannot add wrapper funnel before main funnel has been added to the config');
    }
    const prevFunnel = this.wrapperFunnel ?? {
      ...this.mainFunnel,
      children: this.subFunnels,
    };
    const funnel = generators.funnel(this.preFunnelData, prevFunnel as any);
    const withDefaults = Value.Default(ConfigFunnelAll(true), funnel);
    (this.wrapperFunnel as any) = {
      config: withDefaults,
      network: undefined,
      children: { [prevFunnel.config.displayName]: prevFunnel },
    };
    return this as any;
  };

  addMainFunnel = <
    const Network extends Networks[keyof Networks],
    const Funnel extends MainFunnelConfig<false>,
  >(
    generators: FunnelGenerator<Networks, Network, DeployedAddresses, Funnel>
  ): FunnelConfigBuilder<
    Networks,
    DeployedAddresses,
    FunnelInfo<Network['displayName'], MergeIntersects<Funnel & MainFunnelConfig<true>>>,
    SubFunnels,
    Wrapper
  > => {
    const network = generators.network(this.preFunnelData);
    const funnel = generators.funnel(this.preFunnelData, network);
    const withDefaults = Value.Default(ConfigFunnelAll(true), funnel);
    (this.mainFunnel as any) = {
      network: network.displayName,
      config: withDefaults,
    };
    return this as any;
  };

  addParallelFunnel<
    const Network extends Networks[keyof Networks],
    const Funnel extends ParallelFunnelConfig<false>,
  >(
    // need to add a Main Funnel before adding parallel funnels
    this: MainFunnel extends undefined
      ? never
      : FunnelConfigBuilder<Networks, DeployedAddresses, MainFunnel, SubFunnels>,
    generators: FunnelGenerator<Networks, Network, DeployedAddresses, Funnel>
  ): FunnelConfigBuilder<
    Networks,
    DeployedAddresses,
    MainFunnel,
    SubFunnels & {
      [key in Funnel['displayName']]: FunnelInfo<
        Network['displayName'],
        MergeIntersects<Funnel & ParallelFunnelConfig<true>>
      >;
    },
    Wrapper
  > {
    const network = generators.network(this.preFunnelData);
    const funnel = generators.funnel(this.preFunnelData, network);
    const withDefaults = Value.Default(ConfigFunnelAll(true), funnel);
    if (funnel.displayName in this.subFunnels) {
      throw new Error(`Funnel ${funnel.displayName} is already included in your config`);
    }
    (this.subFunnels[funnel.displayName] as any) = {
      network: network.displayName,
      config: withDefaults,
    };
    return this as any;
  }

  build = (): BuiltFunnel<TopFunnel<Networks, MainFunnel, SubFunnels, Wrapper>> => {
    if (this.mainFunnel === undefined) {
      throw new Error('No main funnel has been added to the config');
    }
    if (this.wrapperFunnel !== undefined) {
      return {
        [this.wrapperFunnel.config.displayName]: this.wrapperFunnel,
      } as any;
    }
    if (Object.keys(this.subFunnels).length === 0) {
      return this.mainFunnel as any;
    }
    return {
      [this.mainFunnel.config.displayName]: {
        ...this.mainFunnel,
        children: this.subFunnels,
      },
    } as any;
  };
}
