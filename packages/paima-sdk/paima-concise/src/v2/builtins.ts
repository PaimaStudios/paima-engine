import { Type } from '@sinclair/typebox';
import type { TSchema } from '@sinclair/typebox';
import { ProjectedNftStatus } from '@dcspark/carp-client';
import { GrammarDefinition } from './types.js';
import { toKeyedJsonGrammar } from './grammar.js';

export const TypeboxHelpers = {
  EvmAddress: Type.RegExp(/^0x[a-fA-F0-9]{40}$/),
  HexString: Type.RegExp(/^0x[a-fA-F0-9]+$/),
  Lowercase: Type.Transform(Type.String()).Decode(value => value.toLowerCase()).Encode(value => value.toLowerCase()),
  TrueOrFalse: Type.Transform(Type.String()).Decode(value => value === 'T').Encode(value => value ? 'T' : 'F'),
  Nullable: <T extends TSchema>(schema: T) => Type.Union([schema, Type.Null()]),
  JsonUnsafeCast: <T>() => Type.Transform(Type.String()).Decode(x => JSON.parse(x) as T).Encode((x: T) => JSON.stringify(x) ),
}

/**
 * Builtins where the prefix is user-determined
 */
export const BuiltinTransitions = {
  ChainDataExtensionErc20Config: [],
  ChainDataExtensionErc20DepositConfig: [
    ['fromAddr', Type.String()],
    ['value', Type.String()],
  ],
  ChainDataExtensionErc721Config: {
    Mint: [
      ['address', Type.String()],
      ['tokenId', Type.String()],
      ['mintData', Type.String()],
    ],
    Burn: [
      ['owner', Type.String()],
      ['tokenId', Type.String()],
    ],
  },
  ChainDataExtensionErc1155Config: {
    Transfer: [
      ['operator', Type.String()],
      ['from', TypeboxHelpers.Lowercase],
      ['to', TypeboxHelpers.Lowercase],
      ['ids', Type.Array(Type.String())],
      ['values', Type.Array(Type.String())],
    ],
    Burn: [
      ['operator', Type.String()],
      ['from', TypeboxHelpers.Lowercase],
      ['ids', Type.Array(Type.String())],
      ['values', Type.Array(Type.String())],
    ],
  },
  ChainDataExtensionErc6551RegistryConfig: [],
  ChainDataExtensionGenericConfig: [
    ['payload', Type.String()],
  ],
  ChainDataExtensionCardanoDelegationConfig: [
    ['address', Type.String()],
    ['pool', TypeboxHelpers.Nullable(Type.String())],
  ],
  ChainDataExtensionCardanoProjectedNFTConfig: [
    ['ownerAddress', Type.String()],
    ['previousTxHash', TypeboxHelpers.Nullable(Type.String())],
    ['previousOutputIndex', TypeboxHelpers.Nullable(Type.Number())],
    ['currentTxHash', Type.String()],
    ['currentOutputIndex', TypeboxHelpers.Nullable(Type.Number())],
    ['policyId', Type.String()],
    ['assetName', Type.String()],
    ['status', Type.Enum(ProjectedNftStatus)]
  ],
  ChainDataExtensionCardanoDelayedAssetConfig: [],
  ChainDataExtensionCardanoTransferConfig: [
    ['txId', Type.String()],
    ['metadata', TypeboxHelpers.Nullable(Type.String())],
    ['inputCredentials', Type.Array(Type.String())],
    ['outputs', TypeboxHelpers.JsonUnsafeCast<{
      asset: {
          policyId: string;
          assetName: string;
      } | null;
      amount: string;
    }[]>()],
  ],
  ChainDataExtensionCardanoMintBurnConfig: [
    ['txId', Type.String()],
    ['metadata', TypeboxHelpers.Nullable(Type.String())],
    ['assets', TypeboxHelpers.JsonUnsafeCast<{ [policyId: string]: { [assetName: string]: string } }>()],
    ['inputAddresses', TypeboxHelpers.JsonUnsafeCast<{
        [address: string]: {
            policyId: string;
            assetName: string;
            amount: string;
        }[];
    }>()],
    ['outputAddresses', TypeboxHelpers.JsonUnsafeCast<{
      [address: string]: {
          policyId: string;
          assetName: string;
          amount: string;
      }[];
  }>()],
  ],
  ChainDataExtensionMinaEventGenericConfig: [],
  ChainDataExtensionMinaActionGenericConfig: [],
  ChainDataExtensionDynamicEvmPrimitiveConfig: [],
  ChainDataExtensionMidnightContractStateConfig: [
    ['payload', Type.String()],
  ],
} as const;

/**
 * builtins are prefixed with '&' to avoid conflicts with user-defined grammars
 */
export const INTERNAL_COMMAND_PREFIX = '&';

export const BuiltinGrammarPrefix = {
  delegateWallet: '&delegate',
  migrateWallet: '&migrate',
  cancelDelegations: '&cancelDelegation',
} as const;
export const BuiltinGrammar = {
  [BuiltinGrammarPrefix.delegateWallet]: [
    ['from', TypeboxHelpers.Nullable(Type.String())],
    ['to', TypeboxHelpers.Nullable(Type.String())],
    ['from_signature', Type.String()],
    ['to_signature', Type.String()],
  ],
  [BuiltinGrammarPrefix.migrateWallet]: [
    ['from', TypeboxHelpers.Nullable(Type.String())],
    ['to', TypeboxHelpers.Nullable(Type.String())],
    ['from_signature', Type.String()],
    ['to_signature', Type.String()],
  ],
  [BuiltinGrammarPrefix.cancelDelegations]: [
    ['to', TypeboxHelpers.Nullable(Type.String())],
  ],
} as const satisfies GrammarDefinition;
export const KeyedBuiltinGrammar = toKeyedJsonGrammar(BuiltinGrammar);