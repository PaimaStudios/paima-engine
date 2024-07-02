import type { Static } from '@sinclair/typebox';
import type {
  CardanoConfig,
  MainEvmConfig,
  BaseConfigWithDefaults,
  MinaConfig,
  OtherEvmConfig,
  AvailConfig,
  AvailMainConfig,
} from './loading.js';
import { loadConfig, ConfigNetworkType } from './loading.js';

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

  public static async mainConfig(): Promise<[string, MainEvmConfig | AvailMainConfig]> {
    const instance = await GlobalConfig.getInstance();

    for (const key of Object.keys(instance)) {
      if (instance[key].type === ConfigNetworkType.EVM) {
        return [key, instance[key] as MainEvmConfig];
      }

      if (instance[key].type === ConfigNetworkType.AVAIL_MAIN) {
        return [key, instance[key] as AvailMainConfig];
      }
    }

    throw new Error('No main chain config found');
  }

  public static async mainEvmConfig(): Promise<[string, MainEvmConfig] | undefined> {
    const instance = await GlobalConfig.getInstance();

    for (const key of Object.keys(instance)) {
      if (instance[key].type === ConfigNetworkType.EVM) {
        return [key, instance[key] as MainEvmConfig];
      }
    }

    return undefined;
  }

  public static async cardanoConfig(): Promise<[string, CardanoConfig] | undefined> {
    const instance = await GlobalConfig.getInstance();

    for (const key of Object.keys(instance)) {
      if (instance[key].type === ConfigNetworkType.CARDANO) {
        return [key, instance[key] as CardanoConfig];
      }
    }

    return undefined;
  }

  public static async otherEvmConfig(): Promise<[string, OtherEvmConfig][]> {
    const instance = await GlobalConfig.getInstance();

    return Object.keys(instance)
      .filter(key => instance[key].type === ConfigNetworkType.EVM_OTHER)
      .map(key => [key, instance[key] as OtherEvmConfig]);
  }

  public static async minaConfig(): Promise<[string, MinaConfig][]> {
    const instance = await GlobalConfig.getInstance();

    return Object.keys(instance)
      .filter(key => instance[key].type === ConfigNetworkType.MINA)
      .map(key => [key, instance[key] as MinaConfig]);
  }

  public static async otherAvailConfig(): Promise<[string, AvailConfig][]> {
    const instance = await GlobalConfig.getInstance();

    return Object.keys(instance)
      .filter(key => instance[key].type === ConfigNetworkType.AVAIL_OTHER)
      .map(key => [key, instance[key] as AvailConfig]);
  }
}
