import * as fs from 'fs/promises';
import YAML from 'yaml';
import type { Static, TSchema } from '@sinclair/typebox';
import { Value, ValueErrorType } from '@sinclair/typebox/value';
import { Type } from '@sinclair/typebox';
import { ENV, doLog } from '../index.js';

export enum ConfigNetworkType {
  EVM = 'evm-main',
  EVM_OTHER = 'evm-other',
  CARDANO = 'cardano',
  MINA = 'mina',
}

export type EvmConfig = Static<typeof EvmConfigSchema>;

export type MainEvmConfig = Static<typeof MainEvmConfigSchema>;

const EvmConfigSchemaRequiredProperties = Type.Object({
  chainUri: Type.String(),
  chainId: Type.Number(),
  chainCurrencyName: Type.String(),
  chainCurrencySymbol: Type.String(),
  chainCurrencyDecimals: Type.Number(),
});

const PaimaL2ContractType = Type.RegExp(/^0x[0-9a-fA-F]{40}$/i);

const EvmConfigSchemaOptionalProperties = Type.Object({
  chainExplorerUri: Type.String({ default: '' }),
  funnelBlockGroupSize: Type.Number({ default: 100 }),
  presyncStepSize: Type.Number({ default: 1000 }),
});

const MainNetworkDiscrimination = Type.Union([
  Type.Object({
    paimaL2ContractAddress: PaimaL2ContractType,
    type: Type.Literal(ConfigNetworkType.EVM),
  }),
  Type.Object({ type: Type.Literal(ConfigNetworkType.EVM_OTHER) }),
]);

export const EvmConfigSchema = Type.Intersect([
  EvmConfigSchemaRequiredProperties,
  EvmConfigSchemaOptionalProperties,
  MainNetworkDiscrimination,
]);

const MainEvmConfigSchema = Type.Intersect([
  EvmConfigSchema,
  Type.Object({ type: Type.Literal(ConfigNetworkType.EVM) }),
]);

export const CardanoConfigSchema = Type.Object({
  carpUrl: Type.String(),
  network: Type.String(),
  confirmationDepth: Type.Number(),
  presyncStepSize: Type.Number({ default: 1000 }),
  paginationLimit: Type.Number({ default: 50 }),
});

export type CardanoConfig = Static<typeof CardanoConfigSchema>;

export const MinaConfigSchema = Type.Object({
  archive: Type.String(),
  graphql: Type.String(),
  confirmationDepth: Type.Number(),
  //presyncStepSize: Type.Number({ default: 1000 }),
});

export type MinaConfig = Static<typeof MinaConfigSchema>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const TaggedEvmConfig = <T extends boolean, U extends boolean>(T: T, MAIN_CONFIG: U) =>
  Type.Union([
    Type.Intersect([
      EvmConfigSchemaRequiredProperties,
      T ? EvmConfigSchemaOptionalProperties : Type.Partial(EvmConfigSchemaOptionalProperties),
      MAIN_CONFIG
        ? Type.Object({
            paimaL2ContractAddress: PaimaL2ContractType,
            type: Type.Literal(ConfigNetworkType.EVM),
          })
        : Type.Object({ type: Type.Literal(ConfigNetworkType.EVM_OTHER) }),
    ]),
  ]);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const TaggedEvmMainConfig = <T extends boolean>(T: T) => TaggedEvmConfig(T, true);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const TaggedEvmOtherConfig = <T extends boolean>(T: T) => TaggedEvmConfig(T, false);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const TaggedCardanoConfig = <T extends boolean>(T: T) =>
  Type.Intersect([
    T ? CardanoConfigSchema : Type.Partial(CardanoConfigSchema),
    Type.Object({ type: Type.Literal(ConfigNetworkType.CARDANO) }),
  ]);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const TaggedMinaConfig = <T extends boolean>(T: T) =>
  Type.Intersect([
    T ? MinaConfigSchema : Type.Partial(MinaConfigSchema),
    Type.Object({ type: Type.Literal(ConfigNetworkType.MINA) }),
  ]);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const TaggedConfig = <T extends boolean>(T: T) =>
  Type.Union([
    TaggedEvmMainConfig(T),
    TaggedEvmOtherConfig(T),
    TaggedCardanoConfig(T),
    TaggedMinaConfig(T),
  ]);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const BaseConfig = <T extends boolean>(T: T) => Type.Record(Type.String(), TaggedConfig(T));

export const BaseConfigWithoutDefaults = BaseConfig(false);
export const BaseConfigWithDefaults = BaseConfig(true);

const evmConfigDefaults = (): Static<typeof EvmConfigSchemaOptionalProperties> => ({
  chainExplorerUri: '',
  funnelBlockGroupSize: 100,
  presyncStepSize: 1000,
});

const cardanoConfigDefaults = {
  presyncStepSize: 1000,
  paginationLimits: 50,
};

const minaConfigDefaults = {
  confirmationDepth: 15,
};

// used as a placeholder name for the ENV fallback mechanism
// will need to be removed afterwards
export const defaultEvmMainNetworkName = 'evm';
export const defaultCardanoNetworkName = 'cardano';

export async function loadConfig(): Promise<Static<typeof BaseConfigWithDefaults> | undefined> {
  let configFileData: string;
  try {
    try {
      configFileData = await fs.readFile(`config.${ENV.NETWORK}.yml`, 'utf8');
    } catch (error) {
      configFileData = await fs.readFile(`config.${ENV.NETWORK}.yaml`, 'utf8');
    }
  } catch (err) {
    // fallback to the ENV config for now to keep backwards compatibility
    const mainConfig: EvmConfig = {
      chainUri: ENV.CHAIN_URI,
      chainId: ENV.CHAIN_ID,
      chainCurrencyName: ENV.CHAIN_CURRENCY_NAME,
      chainCurrencySymbol: ENV.CHAIN_CURRENCY_SYMBOL,
      chainCurrencyDecimals: ENV.CHAIN_CURRENCY_DECIMALS,
      chainExplorerUri: ENV.CHAIN_EXPLORER_URI,
      funnelBlockGroupSize: ENV.DEFAULT_FUNNEL_GROUP_SIZE,
      presyncStepSize: ENV.DEFAULT_PRESYNC_STEP_SIZE,
      paimaL2ContractAddress: ENV.CONTRACT_ADDRESS,
      type: ConfigNetworkType.EVM,
    };

    const baseConfig: Static<typeof BaseConfigWithDefaults> = {
      [defaultEvmMainNetworkName]: mainConfig,
    };

    if (ENV.CARP_URL) {
      baseConfig[defaultCardanoNetworkName] = {
        carpUrl: ENV.CARP_URL,
        network: ENV.CARDANO_NETWORK,
        confirmationDepth: ENV.CARDANO_CONFIRMATION_DEPTH,
        presyncStepSize: ENV.DEFAULT_PRESYNC_STEP_SIZE,
        type: ConfigNetworkType.CARDANO,
      };
    }

    return baseConfig;
  }

  try {
    const config = parseConfigFile(configFileData);

    validateConfig(config);

    for (const network of Object.keys(config)) {
      const networkConfig = config[network];

      switch (networkConfig.type) {
        case ConfigNetworkType.EVM_OTHER:
        case ConfigNetworkType.EVM:
          config[network] = Object.assign(evmConfigDefaults(), networkConfig);
          break;
        case ConfigNetworkType.CARDANO:
          config[network] = Object.assign(cardanoConfigDefaults, networkConfig);
          break;
        case ConfigNetworkType.MINA:
          config[network] = Object.assign(minaConfigDefaults, networkConfig);
          break;
        default:
          throw new Error('unknown network type');
      }
    }

    return config;
  } catch (err) {
    doLog(`Invalid config file:`, err);
    return undefined;
  }
}

// Validate the overall structure of the config file and extract the relevant data
export function parseConfigFile(configFileData: string): Static<typeof BaseConfigWithoutDefaults> {
  // Parse the YAML content into an object
  const configObject = YAML.parse(configFileData);

  const baseStructure = checkOrError(
    'configuration root',
    Type.Record(Type.String(), Type.Any()),
    configObject
  );

  const baseConfig: Static<typeof BaseConfigWithoutDefaults> = {};

  // matching on the discrimination value helps getting better error messages
  // when there are missing properties.
  for (const network of Object.keys(baseStructure)) {
    switch (baseStructure[network].type) {
      case ConfigNetworkType.EVM:
        baseConfig[network] = checkOrError(
          'main evm config entry',
          TaggedEvmConfig(false, true),
          baseStructure[network]
        );
        break;
      case ConfigNetworkType.EVM_OTHER:
        baseConfig[network] = checkOrError(
          'other evm config entry',
          TaggedEvmConfig(false, false),
          baseStructure[network]
        );
        break;
      case ConfigNetworkType.CARDANO:
        baseConfig[network] = checkOrError(
          'cardano config entry',
          TaggedCardanoConfig(false),
          baseStructure[network]
        );
        break;
      case ConfigNetworkType.MINA:
        baseConfig[network] = checkOrError(
          'mina config entry',
          TaggedMinaConfig(false),
          baseStructure[network]
        );
        break;
      default:
        throw new Error('Unknown config network type.');
    }
  }

  return baseConfig;
}

function validateConfig(configs: Static<typeof BaseConfigWithoutDefaults>): void {
  const paimaContractEntries = Object.values(configs).filter(
    config => config.type === ConfigNetworkType.EVM && config.paimaL2ContractAddress
  );

  if (paimaContractEntries.length > 1) {
    throw new Error('There can only be a single network with the paimaL2ContractAddress setting');
  }
}

function checkOrError<T extends TSchema>(name: string, structure: T, config: unknown): Static<T> {
  // 1) Check if there are any errors since Value.Decode doesn't give error messages
  {
    const errors = Array.from(Value.Errors(structure, config)).filter(
      error => error.type !== ValueErrorType.Intersect && error.type !== ValueErrorType.Union
    );

    for (const error of errors) {
      console.error({
        name,
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
