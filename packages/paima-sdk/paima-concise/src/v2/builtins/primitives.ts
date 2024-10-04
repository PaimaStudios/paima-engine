import { Type } from '@sinclair/typebox';
import { ProjectedNftStatus } from '@dcspark/carp-client';
import { TypeboxHelpers } from '@paima/utils';
import { ConfigPrimitiveType } from '@paima/config';
import type { PrimitiveConfig } from '@paima/config';

/**
 * Builtins where the prefix is user-determined
 */
export const BuiltinTransitions = {
  [ConfigPrimitiveType.ERC20]: {},
  [ConfigPrimitiveType.ERC20Deposit]: {
    scheduledPrefix: [
      ['fromAddr', Type.String()],
      ['value', Type.String()],
    ],
  },
  [ConfigPrimitiveType.ERC721]: {
    scheduledPrefix: [
      ['address', Type.String()],
      ['tokenId', Type.String()],
      ['mintData', Type.String()],
    ],
    burnScheduledPrefix: [
      ['owner', Type.String()],
      ['tokenId', Type.String()],
    ],
  },
  [ConfigPrimitiveType.ERC1155]: {
    scheduledPrefix: [
      ['operator', Type.String()],
      ['from', TypeboxHelpers.Lowercase],
      ['to', TypeboxHelpers.Lowercase],
      ['ids', Type.Array(Type.String())],
      ['values', Type.Array(Type.String())],
    ],
    burnScheduledPrefix: [
      ['operator', Type.String()],
      ['from', TypeboxHelpers.Lowercase],
      ['ids', Type.Array(Type.String())],
      ['values', Type.Array(Type.String())],
    ],
  },
  [ConfigPrimitiveType.ERC6551Registry]: {},
  [ConfigPrimitiveType.DynamicEvmPrimitive]: {},
  [ConfigPrimitiveType.Generic]: {
    scheduledPrefix: [['payload', Type.String()]],
  },
  [ConfigPrimitiveType.CardanoDelegation]: {
    scheduledPrefix: [
      ['address', Type.String()],
      ['pool', TypeboxHelpers.Nullable(Type.String())],
    ],
  },
  [ConfigPrimitiveType.CardanoProjectedNFT]: {
    scheduledPrefix: [
      ['ownerAddress', Type.String()],
      ['previousTxHash', TypeboxHelpers.Nullable(Type.String())],
      ['previousOutputIndex', TypeboxHelpers.Nullable(Type.Number())],
      ['currentTxHash', Type.String()],
      ['currentOutputIndex', TypeboxHelpers.Nullable(Type.Number())],
      ['policyId', Type.String()],
      ['assetName', Type.String()],
      ['status', Type.Enum(ProjectedNftStatus)],
    ],
  },
  [ConfigPrimitiveType.CardanoDelayedAsset]: {},
  [ConfigPrimitiveType.CardanoTransfer]: {
    scheduledPrefix: [
      ['txId', Type.String()],
      ['metadata', TypeboxHelpers.Nullable(Type.String())],
      ['inputCredentials', Type.Array(Type.String())],
      [
        'outputs',
        TypeboxHelpers.JsonUnsafeCast<
          {
            asset: {
              policyId: string;
              assetName: string;
            } | null;
            amount: string;
          }[]
        >(),
      ],
    ],
  },
  [ConfigPrimitiveType.CardanoMintBurn]: {
    scheduledPrefix: [
      ['txId', Type.String()],
      ['metadata', TypeboxHelpers.Nullable(Type.String())],
      [
        'assets',
        TypeboxHelpers.JsonUnsafeCast<{ [policyId: string]: { [assetName: string]: string } }>(),
      ],
      [
        'inputAddresses',
        TypeboxHelpers.JsonUnsafeCast<{
          [address: string]: {
            policyId: string;
            assetName: string;
            amount: string;
          }[];
        }>(),
      ],
      [
        'outputAddresses',
        TypeboxHelpers.JsonUnsafeCast<{
          [address: string]: {
            policyId: string;
            assetName: string;
            amount: string;
          }[];
        }>(),
      ],
    ],
  },
  [ConfigPrimitiveType.MinaEventGeneric]: {},
  [ConfigPrimitiveType.MinaActionGeneric]: {},
  [ConfigPrimitiveType.MidnightContractState]: {
    scheduledPrefix: [['payload', Type.String()]],
  },
} as const;

type NonNeverKeys<T> = {
  [K in keyof T]: T[K] extends never ? never : K;
}[keyof T];

type MapPrimitivesToTuplesReturn<T extends PrimitiveConfig> = {
  [K in keyof T as T[K] & string]: (typeof BuiltinTransitions)[T['type']] extends Record<
    K,
    infer GrammarEntry
  >
    ? GrammarEntry
    : never;
};

type FilterNever<T> = Pick<T, NonNeverKeys<T>>;

export type PrimitivesToGrammar<T extends Record<string, { primitive: PrimitiveConfig }>> =
  FilterNever<MapPrimitivesToTuplesReturn<T[keyof T]['primitive']>>;
export function mapPrimitivesToGrammar<T extends Record<string, { primitive: PrimitiveConfig }>>(
  primitives: T
): PrimitivesToGrammar<T> {
  const result = {} as Record<string, any>;
  for (const { primitive } of Object.values(primitives)) {
    const transitions = BuiltinTransitions[primitive.type];
    for (const transition of Object.keys(transitions) as (keyof typeof transitions)[]) {
      // filter out optional prefixes that the user did not define
      if (transition in primitive) {
        result[primitive[transition]] = transitions[transition];
      }
    }
  }
  return result as any;
}
