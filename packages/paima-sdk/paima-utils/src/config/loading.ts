import * as fs from 'fs/promises';
import YAML from 'yaml';
import type { Static, TSchema } from '@sinclair/typebox';
import type { ValueErrorType } from '@sinclair/typebox/value';
import { Value } from '@sinclair/typebox/value';
import { Type } from '@sinclair/typebox';
import { ENV, doLog } from '../index.js';

export enum ConfigNetworkType {
  EVM = 'evm-main',
  EVM_OTHER = 'evm-other',
  CARDANO = 'cardano',
}

export type EvmConfig = Static<typeof EvmConfigSchema>;

export const EvmConfigSchema = Type.Object({
  chainUri: Type.String({ default: '' }),
  chainId: Type.Number({ default: 0 }),
  chainExplorerUri: Type.String({ default: '' }),
  chainCurrencyName: Type.String({ default: 'UNKNOWN_CURRENCY_NAME' }),
  chainCurrencySymbol: Type.String({ default: 'NONAME' }),
  chainCurrencyDecimals: Type.Number({ default: 0 }),
  // TODO: this depends on the settings actually, but hard to express that
  //ENV.BLOCK_TIME - 0.1
  blockTime: Type.Number({ default: 4 }),
  pollingRate: Type.Number({ default: 4 - 0.1 }),
  deployment: Type.String({ default: '' }),
  paimaL2ContractAddress: Type.RegExp(/^0x[0-9a-fA-F]{40}$/i),
  funnelBlockGroupSize: Type.Number({ default: 100 }),
});

export const CardanoConfigSchema = Type.Object({
  carpUrl: Type.String(),
  network: Type.String(),
  confirmationDepth: Type.Number(),
});

export type CardanoConfig = Static<typeof CardanoConfigSchema>;

export const TaggedConfig = <T extends boolean>(T: T) =>
  Type.Union([
    Type.Intersect([
      T ? EvmConfigSchema : Type.Partial(EvmConfigSchema),
      Type.Required(
        Type.Object({
          type: Type.Union([
            Type.Literal(ConfigNetworkType.EVM),
            Type.Literal(ConfigNetworkType.EVM_OTHER),
          ]),
        })
      ),
    ]),
    Type.Intersect([
      CardanoConfigSchema,
      Type.Object({ type: Type.Literal(ConfigNetworkType.CARDANO) }),
    ]),
  ]);

export const BaseConfig = <T extends boolean>(T: T) => Type.Record(Type.String(), TaggedConfig(T));

export const BaseConfigWithoutDefaults = BaseConfig(false);
export const BaseConfigWithDefaults = BaseConfig(true);
export const FullEvmConfig = EvmConfigSchema;

const evmConfigDefaults = (blockTime: number | undefined) => ({
  chainUri: '',
  chainId: 0,
  chainExplorerUri: '',
  chainCurrencyName: 'UNKNOWN_CURRENCY_NAME',
  chainCurrencySymbol: 'NONAME',
  chainCurrencyDecimals: 0,
  blockTime: 4,
  pollingRate: (blockTime || 4) - 0.1,
  deployment: '',
  funnelBlockGroupSize: 100,
});

export async function loadConfig(): Promise<Static<typeof BaseConfigWithDefaults> | undefined> {
  let configFileData: string;
  try {
    // TODO: would be nice to also read .yaml
    configFileData = await fs.readFile(`config.${ENV.NETWORK}.yml`, 'utf8');
  } catch (err) {
    throw new Error('config file not found');
  }

  try {
    const config = parseConfigFile(configFileData);

    for (const network of Object.keys(config)) {
      const networkConfig = config[network];

      switch (networkConfig.type) {
        case ConfigNetworkType.EVM_OTHER:
        case ConfigNetworkType.EVM:
          // TODO: current version of typebox doesn't have Value.Default
          config[network] = Object.assign(
            evmConfigDefaults(networkConfig.blockTime),
            networkConfig
          );
          break;
        case ConfigNetworkType.CARDANO:
        default:
          throw new Error('unknown network type');
      }
    }

    return config;
  } catch (err) {
    // doLog(`Invalid config file: ${err}`);
    return undefined;
  }
}

// Validate the overall structure of the config file and extract the relevant data
export function parseConfigFile(configFileData: string): Static<typeof BaseConfigWithoutDefaults> {
  // Parse the YAML content into an object
  const configObject = YAML.parse(configFileData);

  // Validate the YAML object against the schema
  const baseConfig = checkOrError(undefined, BaseConfigWithoutDefaults, configObject);

  return baseConfig;
}

// TODO: copy pasted code
function checkOrError<T extends TSchema>(
  name: undefined | string,
  structure: T,
  config: unknown
): Static<T> {
  // 1) Check if there are any errors since Value.Decode doesn't give error messages
  {
    const skippableErrors: ValueErrorType[] = [];

    const errors = Array.from(Value.Errors(structure, config));
    for (const error of errors) {
      if (errors.length !== 1 && skippableErrors.find(val => val === error.type) != null) continue;
      console.error({
        name: name ?? 'Configuration root',
        path: error.path,
        valueProvided: error.value,
        message: error.message,
      });
    }
    if (errors.length > 1) {
      throw new Error(`config field missing or invalid. See above for error.`);
    }
  }

  const decoded = Value.Decode(structure, config);
  return decoded;
}
