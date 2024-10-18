import type { ShallowMergeIntersects } from '@paima/utils';
import type { ConfigFunnelMappingMain, FunnelWithNetwork } from '../schema/index.js';
import { caip2PrefixFor, mainFunnelTypes } from '../schema/index.js';
import type {
  FlattenedFunnelTree,
  FunnelConfig,
  FunnelInfo,
  FunnelsList,
  MainFunnelConfig,
  NetworkConfig,
} from './types.js';

type ElementOf<T extends any[]> = T extends (infer Elem)[] ? Elem : never;
type ValueOf<T> = T[keyof T];
type PickType<Entries extends any[], KeyName extends string, Type> = {
  [K in keyof Entries]: Entries[K] extends Record<KeyName, infer TypeVal>
    ? TypeVal extends Type
      ? ShallowMergeIntersects<Entries[K]>
      : never
    : never;
};
type GetTypes<KeyName extends string, T extends any[]> = {
  [K in keyof T]: T[K] extends Record<KeyName, infer Type> ? Type : never;
}[keyof T];

class ConfigQuery<KeyName extends string, ConfigType extends Record<KeyName, string>[]> {
  constructor(
    public readonly config: ConfigType,
    private readonly keyname: KeyName
  ) {
    // TODO: replace once TS5 decorators are better supported
    this.getConfigs.bind(this);
    this.getSingleConfig.bind(this);
    this.getOptionalConfig.bind(this);
  }

  getConfigs = <T extends GetTypes<KeyName, ConfigType>>(
    targets: T[]
  ): PickType<ConfigType, KeyName, T> => {
    const result = [];
    for (const key of Object.keys(this.config)) {
      const network = this.config[key as any];
      if (targets.includes(network[this.keyname] as any)) {
        result.push(this.config[key as any] as any);
      }
    }
    return result as any;
  };

  getSingleConfig = <T extends GetTypes<KeyName, ConfigType>>(
    targets: T
  ): ElementOf<PickType<ConfigType, KeyName, T>> => {
    const configs = this.getConfigs<T>([targets]);
    if (configs.length === 0) {
      throw new Error(`No config found searching for: ${JSON.stringify(targets)}`);
    }
    if (configs.length > 1) {
      throw new Error(
        `Found ${configs.length} configs, but expected ${1} when searching for: ${JSON.stringify(targets)}`
      );
    }
    return configs[0] as any;
  };

  getOptionalConfig = <T extends GetTypes<KeyName, ConfigType>>(
    targets: T
  ): undefined | ElementOf<PickType<ConfigType, KeyName, T>> => {
    const configs = this.getConfigs<T>([targets]);
    if (configs.length === 0) {
      return undefined;
    }
    if (configs.length > 1) {
      throw new Error(
        `Found ${configs.length} configs, but expected ${1} when searching for: ${JSON.stringify(targets)}`
      );
    }
    return configs[0] as any;
  };
}

export function networkConfigQuery<ConfigType extends Record<string, NetworkConfig>>(
  config: ConfigType
): NetworkConfigQuery<ConfigType> {
  return new NetworkConfigQuery(config);
}
export class NetworkConfigQuery<ConfigType extends Record<string, NetworkConfig>> {
  public readonly queryType: ConfigQuery<'type', ValueOf<ConfigType>[]>;
  public readonly queryDisplayName: ConfigQuery<'displayName', ValueOf<ConfigType>[]>;

  constructor(public readonly config: ConfigType) {
    this.queryType = new ConfigQuery(config as any, 'type') as any;
    this.queryDisplayName = new ConfigQuery(config as any, 'displayName') as any;
    // TODO: replace once TS5 decorators are better supported
    this.networkForCaip2.bind(this);
  }

  networkForCaip2 = (targetCaip2: string): undefined | ValueOf<ConfigType> => {
    for (const key of Object.keys(this.config)) {
      const caip2 = caip2PrefixFor(this.config[key]);
      if (caip2 === targetCaip2) {
        return this.config[key] as any;
      }
    }
    return undefined;
  };
}

type ExtractFunnelConfig<ConfigType extends Record<string, FunnelInfo<string, FunnelConfig>>> = {
  [key in keyof ConfigType]: { network: ConfigType[key]['network'] } & ConfigType[key]['config'];
};
export function funnelConfigQuery<ConfigType extends FunnelsList<any, any, any>>(
  config: ConfigType
): FunnelConfigQuery<ConfigType> {
  return new FunnelConfigQuery(config);
}
export class FunnelConfigQuery<ConfigType extends FunnelsList<any, any, any>> {
  public readonly flattenedTree: FlattenedFunnelTree<ConfigType>;
  public readonly queryNetworkName: ConfigQuery<
    'network',
    ValueOf<ExtractFunnelConfig<FlattenedFunnelTree<ConfigType>>>[]
  >;
  public readonly queryFunnelType: ConfigQuery<
    'type',
    ValueOf<ExtractFunnelConfig<FlattenedFunnelTree<ConfigType>>>[]
  >;
  public readonly queryDisplayName: ConfigQuery<
    'displayName',
    ValueOf<ExtractFunnelConfig<FlattenedFunnelTree<ConfigType>>>[]
  >;
  public readonly flattenedConfig: ExtractFunnelConfig<FlattenedFunnelTree<ConfigType>>;

  constructor(public readonly funnelInfoConfig: ConfigType) {
    this.flattenedTree = FunnelConfigQuery.flattenTree<ConfigType>(funnelInfoConfig);
    this.flattenedConfig = Object.fromEntries(
      Object.entries(this.flattenedTree).map(([name, info]) => [
        name,
        {
          ...info.config,
          network: info.network,
        },
      ])
    ) as any;
    this.queryNetworkName = new ConfigQuery(Object.values(this.flattenedConfig), 'network');
    this.queryFunnelType = new ConfigQuery(Object.values(this.flattenedConfig), 'type');
    this.queryDisplayName = new ConfigQuery(Object.values(this.flattenedConfig), 'displayName');

    // TODO: replace once TS5 decorators are better supported
    this.mainConfig.bind(this);
  }

  static flattenTree<ConfigType extends FunnelsList<any, any, any>>(
    tree: ConfigType
  ): FlattenedFunnelTree<ConfigType> {
    const result = {} as FlattenedFunnelTree<ConfigType>;
    this.#flattenTree(tree, undefined, result);
    return result;
  }

  static #flattenTree<ConfigType extends FunnelsList<any, any, any>>(
    tree: ConfigType,
    parent: string | undefined,
    result: FlattenedFunnelTree<ConfigType>
  ): void {
    for (const [key, value] of Object.entries(tree)) {
      (result as any)[key] = {
        ...value,
        parent,
      };
      if (value.children) {
        this.#flattenTree(value.children, key, result);
      }
    }
  }

  mainConfig = (): MainConfigType<ConfigType> extends never
    ? // if we lost the static type information for the config
      // we just return the type of all possible main funnels
      FunnelWithNetwork<MainFunnelConfig<true>>
    : MainConfigType<ConfigType> => {
    const mainConfigs = Object.keys(mainFunnelTypes);
    for (const entry of Object.values(this.flattenedConfig)) {
      if (mainConfigs.includes(entry.type as any)) {
        return entry;
      }
    }
    throw new Error('No main funnel found in config');
  };
}

type MainConfigType<ConfigType extends FunnelsList<any, any, any>> = ElementOf<
  PickType<
    ValueOf<ExtractFunnelConfig<FlattenedFunnelTree<ConfigType>>>[],
    'type',
    GetTypes<'type', ValueOf<ExtractFunnelConfig<FlattenedFunnelTree<ConfigType>>>[]> &
      keyof ConfigFunnelMappingMain
  >
>;
