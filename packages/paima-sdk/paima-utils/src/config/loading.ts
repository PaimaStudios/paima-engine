import YAML from 'yaml';
import type { Static, TIntersect, TLiteral, TObject, TSchema } from '@sinclair/typebox';
import { Value, ValueErrorType } from '@sinclair/typebox/value';
import { Type } from '@sinclair/typebox';
import { ENV, doLog } from '../index.js';
import { toChainId, registry } from '@dcspark/cip34-js';
import assertNever from 'assert-never';

export enum ConfigNetworkType {
  EVM = 'evm-main',
  EVM_OTHER = 'evm-other',
  CARDANO = 'cardano',
  MINA = 'mina',
  AVAIL_MAIN = 'avail-main',
  AVAIL_OTHER = 'avail-other',
  MIDNIGHT = 'midnight',
}

export type ConfigMapping = {
  [ConfigNetworkType.EVM]: MainEvmConfig;
  [ConfigNetworkType.EVM_OTHER]: OtherEvmConfig;
  [ConfigNetworkType.CARDANO]: CardanoConfig;
  [ConfigNetworkType.MINA]: MinaConfig;
  [ConfigNetworkType.AVAIL_MAIN]: AvailMainConfig;
  [ConfigNetworkType.AVAIL_OTHER]: AvailConfig;
  [ConfigNetworkType.MIDNIGHT]: MidnightConfig;
};

export type TypeToConfig<T extends ConfigNetworkType> = ConfigMapping[T];
export type TypesToConfigs<T extends ConfigNetworkType[]> = TypeToConfig<T[number]>;

export type EvmConfig = Static<typeof BaseEvmConfigSchema>;

export type MainEvmConfig = Static<typeof MainEvmConfigSchema>;
export type OtherEvmConfig = Static<typeof OtherEvmConfigSchema>;

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
  Type.Object({
    delay: Type.Optional(Type.Number()),
    confirmationDepth: Type.Optional(Type.Number()),
    type: Type.Literal(ConfigNetworkType.EVM_OTHER),
  }),
]);

export const BaseEvmConfigSchema = Type.Intersect([
  EvmConfigSchemaRequiredProperties,
  EvmConfigSchemaOptionalProperties,
  MainNetworkDiscrimination,
]);

export const MainEvmConfigSchema = addType(BaseEvmConfigSchema, ConfigNetworkType.EVM);
export const OtherEvmConfigSchema = addType(BaseEvmConfigSchema, ConfigNetworkType.EVM_OTHER);

export const CardanoNetwork = Type.Union([
  Type.Literal('preview'),
  Type.Literal('preprod'),
  Type.Literal('mainnet'),
]);

export const CardanoRequiredProperties = Type.Object({
  carpUrl: Type.String(),
  network: CardanoNetwork,
  confirmationDepth: Type.Number(),
});

export const CardanoOptionalProperties = Type.Object({
  presyncStepSize: Type.Number({ default: 1000 }),
  paginationLimit: Type.Number({ default: 50 }),
});

export const BaseCardanoConfigSchema = Type.Intersect([
  CardanoRequiredProperties,
  CardanoOptionalProperties,
  Type.Object({ type: Type.Literal(ConfigNetworkType.CARDANO) }),
]);
export const CardanoConfigSchema = addType(BaseCardanoConfigSchema, ConfigNetworkType.CARDANO);

export type CardanoConfig = Static<typeof CardanoConfigSchema>;

export const BaseMinaConfigSchema = Type.Object({
  archiveConnectionString: Type.String(),
  delay: Type.Number(),
  paginationLimit: Type.Number({ default: 50 }),
  confirmationDepth: Type.Optional(Type.Number()),
  networkId: Type.String(),
});

export const MinaConfigSchema = addType(BaseMinaConfigSchema, ConfigNetworkType.MINA);
export type MinaConfig = Static<typeof MinaConfigSchema>;

export const AvailRequiredProperties = Type.Object({
  rpc: Type.String(),
  lightClient: Type.String(),
  genesisHash: Type.String({ maxLength: 66, minLength: 66, pattern: '^0x[a-fA-F0-9]+$' }),
  type: Type.Union([
    Type.Literal(ConfigNetworkType.AVAIL_MAIN),
    Type.Literal(ConfigNetworkType.AVAIL_OTHER),
  ]),
});

export const AvailOptionalProperties = Type.Object({
  delay: Type.Number(),
  funnelBlockGroupSize: Type.Number({ default: 100 }),
  presyncStepSize: Type.Number({ default: 1000 }),
});

export const BaseAvailConfigSchema = Type.Intersect([
  AvailRequiredProperties,
  AvailOptionalProperties,
]);

export const AvailMainConfigSchema = addType(BaseAvailConfigSchema, ConfigNetworkType.AVAIL_MAIN);
export const AvailOtherConfigSchema = addType(BaseAvailConfigSchema, ConfigNetworkType.AVAIL_OTHER);

export type AvailMainConfig = Static<typeof AvailMainConfigSchema>;
export type AvailConfig = Static<typeof AvailOtherConfigSchema>;

export const BaseMidnightConfigSchema = Type.Object({
  // Midnight network connection info.
  networkId: Type.Number(),
  indexer: Type.String(),
  indexerWS: Type.Optional(Type.String()),
  // node URL and proof server are not needed for our read-only use

  // Wait until we have both 1 upstream block AND this many future Midnight blocks before processing a Midnight block.
  // Can reduce latency because we will have 1+ earlier than we will have 0
  confirmationDepth: Type.Number(),
});

export const MidnightConfigSchema = addType(BaseMidnightConfigSchema, ConfigNetworkType.MIDNIGHT);

export type MidnightConfig = Static<typeof MidnightConfigSchema>;

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
    CardanoRequiredProperties,
    T ? CardanoOptionalProperties : Type.Partial(CardanoOptionalProperties),
    Type.Object({ type: Type.Literal(ConfigNetworkType.CARDANO) }),
  ]);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const TaggedMinaConfig = <T extends boolean>(T: T) =>
  Type.Intersect([
    T ? MinaConfigSchema : Type.Partial(MinaConfigSchema),
    Type.Object({ type: Type.Literal(ConfigNetworkType.MINA) }),
  ]);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const TaggedAvailMainConfig = <T extends boolean>(T: T) =>
  Type.Intersect([
    AvailRequiredProperties,
    T ? AvailOptionalProperties : Type.Partial(AvailOptionalProperties),
    Type.Object({ type: Type.Literal(ConfigNetworkType.AVAIL_MAIN) }),
  ]);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const TaggedAvailOtherConfig = <T extends boolean>(T: T) =>
  Type.Intersect([
    AvailRequiredProperties,
    T ? AvailOptionalProperties : Type.Partial(AvailOptionalProperties),
    Type.Object({ type: Type.Literal(ConfigNetworkType.AVAIL_OTHER) }),
  ]);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const TaggedMidnightConfig = <T extends boolean>(T: T) =>
  Type.Intersect([
    MidnightConfigSchema,
    //T ? MidnightOptionalProperties : Type.Partial(AvailOptionalProperties),
    Type.Object({ type: Type.Literal(ConfigNetworkType.MIDNIGHT) }),
  ]);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const TaggedConfig = <T extends boolean>(T: T) =>
  Type.Union([
    TaggedEvmMainConfig(T),
    TaggedEvmOtherConfig(T),
    TaggedCardanoConfig(T),
    TaggedMinaConfig(T),
    TaggedAvailMainConfig(T),
    TaggedAvailOtherConfig(T),
    TaggedMidnightConfig(T),
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
  // lightnet defaults
  confirmationDepth: 30,
  delay: 30 * 40,
};

const midnightConfigDefaults = {};

const availConfigDefaults = {
  funnelBlockGroupSize: 100,
  delay: 3 * 20,
  presyncStepSize: 1000,
};

// used as a placeholder name for the ENV fallback mechanism
// will need to be removed afterwards
export const defaultEvmMainNetworkName = 'evm';
export const defaultCardanoNetworkName = 'cardano';
export const defaultMinaNetworkName = 'mina';

export async function loadConfig(): Promise<Static<typeof BaseConfigWithDefaults> | undefined> {
  let configFileData: string;
  try {
    const fs = await import('fs/promises');
    try {
      configFileData = await fs.readFile(`config.${ENV.NETWORK}.yml`, 'utf8');
    } catch (error) {
      configFileData = await fs.readFile(`config.${ENV.NETWORK}.yaml`, 'utf8');
    }
  } catch (err) {
    // injected at build time with the middleware esbuild template
    if (process.env.BUILT_TIME_INJECTED_CONFIGURATION) {
      configFileData = process.env.BUILT_TIME_INJECTED_CONFIGURATION;
    } else {
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
        if (!ENV.CARDANO_CONFIRMATION_DEPTH) {
          throw new Error('[carp-funnel] Missing CARDANO_CONFIRMATION_DEPTH setting.');
        }

        const network = Value.Decode(CardanoNetwork, ENV.CARDANO_NETWORK);

        baseConfig[defaultCardanoNetworkName] = {
          carpUrl: ENV.CARP_URL,
          network,
          confirmationDepth: ENV.CARDANO_CONFIRMATION_DEPTH,
          presyncStepSize: ENV.DEFAULT_PRESYNC_STEP_SIZE,
          type: ConfigNetworkType.CARDANO,
        };
      }

      return baseConfig;
    }
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
          config[network] = Object.assign({}, cardanoConfigDefaults, networkConfig);
          break;
        case ConfigNetworkType.MINA:
          config[network] = Object.assign({}, minaConfigDefaults, networkConfig);
          break;
        case ConfigNetworkType.AVAIL_MAIN:
        case ConfigNetworkType.AVAIL_OTHER:
          config[network] = Object.assign({}, availConfigDefaults, networkConfig);
          break;
        case ConfigNetworkType.MIDNIGHT:
          config[network] = Object.assign({}, midnightConfigDefaults, networkConfig);
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
  const configObject = YAML.parse(configFileData, { merge: true });

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
      case ConfigNetworkType.AVAIL_MAIN:
        baseConfig[network] = checkOrError(
          'avail main config entry',
          TaggedAvailMainConfig(false),
          baseStructure[network]
        );
        break;
      case ConfigNetworkType.AVAIL_OTHER:
        baseConfig[network] = checkOrError(
          'avail other config entry',
          TaggedAvailOtherConfig(false),
          baseStructure[network]
        );
        break;
      case ConfigNetworkType.MIDNIGHT:
        baseConfig[network] = checkOrError(
          'midnight config entry',
          TaggedMidnightConfig(false),
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

  const mainNetworks = Object.values(configs).filter(
    config => config.type === ConfigNetworkType.EVM || config.type === ConfigNetworkType.AVAIL_MAIN
  );

  if (mainNetworks.length > 1) {
    throw new Error('There can only be a single main network (evm or avail_main types)');
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

const InstantiatedConfigsUnion = TaggedConfig(true);

export function caip2PrefixFor(config: Static<typeof InstantiatedConfigsUnion>): string {
  const type = config.type;

  switch (type) {
    case ConfigNetworkType.EVM:
    case ConfigNetworkType.EVM_OTHER:
      return `eip155:${config.chainId}`;
    case ConfigNetworkType.MINA:
      return `mina:${config.networkId}`;
    case ConfigNetworkType.CARDANO:
      return networkToCip34(config);
    case ConfigNetworkType.AVAIL_MAIN:
    case ConfigNetworkType.AVAIL_OTHER:
      return `polkadot:${config.genesisHash.slice(2, 32 + 2)}`;
    case ConfigNetworkType.MIDNIGHT:
      return `midnight:${config.networkId}`;
    default:
      assertNever(type);
  }
}
function networkToCip34(
  config: Static<typeof InstantiatedConfigsUnion> & { type: ConfigNetworkType.CARDANO }
): string {
  switch (config.network) {
    case 'mainnet':
      return toChainId({
        networkId: registry.Mainnet.NetworkId,
        networkMagic: registry.Mainnet.NetworkMagic,
      });
    case 'preprod':
      return toChainId({
        networkId: registry.PreProduction.NetworkId,
        networkMagic: registry.PreProduction.NetworkMagic,
      });
    case 'preview':
      return toChainId({
        networkId: registry.Preview.NetworkId,
        networkMagic: registry.Preview.NetworkMagic,
      });
    default:
      assertNever(config.network);
  }
}

function addType<BaseSchema extends TSchema, Type extends ConfigNetworkType>(
  schema: BaseSchema,
  type: Type
): TIntersect<[BaseSchema, TObject<{ type: TLiteral<Type> }>]> {
  return Type.Intersect([schema, Type.Object({ type: Type.Literal(type) })]);
}
