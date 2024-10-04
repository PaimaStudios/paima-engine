import { Type } from '@sinclair/typebox';
import type { GrammarDefinition } from '../types.js';
import { toKeyedJsonGrammar } from '../grammar.js';
import { AddressType } from '@paima/utils';

/**
 * builtins are prefixed with '&' to avoid conflicts with user-defined grammars
 */
export const INTERNAL_COMMAND_PREFIX = '&';

export const BatcherInnerCommon = [
  ['userAddress', Type.String()],
  ['userSignature', Type.String()],
  ['gameInput', Type.String()],
  ['millisecondTimestamp', Type.String()],
] as const;
export const BatcherInnerGrammar = {
  [`${AddressType.EVM}`]: BatcherInnerCommon,
  [`${AddressType.CARDANO}`]: BatcherInnerCommon,
  [`${AddressType.POLKADOT}`]: BatcherInnerCommon,
  [`${AddressType.ALGORAND}`]: BatcherInnerCommon,
  [`${AddressType.MINA}`]: BatcherInnerCommon,
} as const satisfies GrammarDefinition;
export const KeyedBuiltinBatcherInnerGrammar = toKeyedJsonGrammar(BatcherInnerGrammar);
