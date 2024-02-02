import { Static } from '@sinclair/typebox';
import { BaseConfigWithDefaults, loadConfig, EvmConfigSchema, CardanoConfig } from './loading';

export type Config = Static<typeof BaseConfigWithDefaults>;

export class GlobalConfig {
  private static instance: Config;
  private static promise: Promise<void> | null;

  private constructor() {}

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
      });
    }

    await GlobalConfig.promise;
    return GlobalConfig.instance;
  }

  public static async mainEvmConfig(): Promise<[string, Static<typeof EvmConfigSchema>]> {
    const instance = await GlobalConfig.getInstance();

    for (const key of Object.keys(instance)) {
      if (instance[key].type === 'evm-main') {
        // TODO: try to remove this cast
        return [key, instance[key] as Static<typeof EvmConfigSchema>];
      }
    }

    throw new Error('main config not found');
  }

  public static async cardanoConfig(): Promise<CardanoConfig | undefined> {
    const instance = await GlobalConfig.getInstance();

    for (const key of Object.keys(instance)) {
      if (instance[key].type === 'cardano') {
        // TODO: try to remove this cast
        return instance[key] as CardanoConfig;
      }
    }

    return undefined;
  }
}
