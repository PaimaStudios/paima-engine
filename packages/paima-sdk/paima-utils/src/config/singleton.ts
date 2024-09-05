import type { Static } from '@sinclair/typebox';
import type {
  CardanoConfig,
  MainEvmConfig,
  BaseConfigWithDefaults,
  MinaConfig,
  OtherEvmConfig,
  AvailConfig,
  AvailMainConfig,
  ConfigMapping,
} from './loading.js';
import { loadConfig, ConfigNetworkType, caip2PrefixFor } from './loading.js';
import type { TypeToConfig, TypesToConfigs } from './loading.js';

export type Config = Static<typeof BaseConfigWithDefaults>;

export class GlobalConfig {
  private static instance: Config;
  private static promise: Promise<void> | null;

  public static async getInstance(): Promise<Config> {
    // avoid double initialization/race
    if (!GlobalConfig.promise) {
      GlobalConfig.promise = loadConfig().then(config => {
        if (!GlobalConfig.instance) {
          if (!config) {
            throw new Error("Couldn't read config file");
          }

          GlobalConfig.instance = config;
        }
        return;
      });
    }

    await GlobalConfig.promise;
    return GlobalConfig.instance;
  }

  public static async networkForCaip2(
    targetCaip2: string
  ): Promise<undefined | [string, ConfigMapping[ConfigNetworkType]]> {
    const instance = await GlobalConfig.getInstance();

    for (const key of Object.keys(instance)) {
      const caip2 = caip2PrefixFor(instance[key]);
      if (caip2 === targetCaip2) {
        return [key, instance[key] as any];
      }
    }
    return undefined;
  }

  private static async getConfigs<T extends ConfigNetworkType[]>(
    targets: T
  ): Promise<[string, TypesToConfigs<T>][]> {
    const instance = await GlobalConfig.getInstance();

    const result: [string, TypesToConfigs<T>][] = [];
    for (const key of Object.keys(instance)) {
      if (targets.includes(instance[key].type)) {
        result.push([key, instance[key] as any as TypesToConfigs<T>]);
      }
    }
    return result;
  }

  public static async getSingleConfig<T extends ConfigNetworkType[]>(
    targets: T
  ): Promise<[string, TypesToConfigs<T>]> {
    const configs = await GlobalConfig.getConfigs<T>(targets);
    if (configs.length === 0) {
      throw new Error(`No config found searching for: ${JSON.stringify(targets)}`);
    }
    if (configs.length > 1) {
      throw new Error(
        `Found ${configs.length} configs, but expected ${1} when searching for: ${JSON.stringify(targets)}`
      );
    }
    return configs[0];
  }
  public static async getOptionalConfig<T extends ConfigNetworkType>(
    targets: T
  ): Promise<undefined | [string, TypeToConfig<T>]> {
    const configs = await GlobalConfig.getConfigs<T[]>([targets]);
    if (configs.length === 0) {
      return undefined;
    }
    if (configs.length > 1) {
      throw new Error(
        `Found ${configs.length} configs, but expected ${1} when searching for: ${JSON.stringify(targets)}`
      );
    }
    return configs[0];
  }

  public static async mainConfig(): Promise<[string, MainEvmConfig | AvailMainConfig]> {
    return await GlobalConfig.getSingleConfig([
      ConfigNetworkType.EVM,
      ConfigNetworkType.AVAIL_MAIN,
    ]);
  }

  public static async mainEvmConfig(): Promise<[string, MainEvmConfig] | undefined> {
    return await GlobalConfig.getOptionalConfig(ConfigNetworkType.EVM);
  }

  public static async mainAvailConfig(): Promise<[string, AvailMainConfig] | undefined> {
    return await GlobalConfig.getOptionalConfig(ConfigNetworkType.AVAIL_MAIN);
  }

  public static async cardanoConfig(): Promise<[string, CardanoConfig] | undefined> {
    return await GlobalConfig.getOptionalConfig(ConfigNetworkType.CARDANO);
  }

  public static async otherEvmConfig(): Promise<[string, OtherEvmConfig][]> {
    return await GlobalConfig.getConfigs([ConfigNetworkType.EVM_OTHER]);
  }

  public static async minaConfig(): Promise<[string, MinaConfig][]> {
    return await GlobalConfig.getConfigs([ConfigNetworkType.MINA]);
  }

  public static async otherAvailConfig(): Promise<[string, AvailConfig] | undefined> {
    return await GlobalConfig.getOptionalConfig(ConfigNetworkType.AVAIL_OTHER);
  }
}
