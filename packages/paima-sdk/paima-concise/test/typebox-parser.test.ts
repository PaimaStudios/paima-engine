import { describe, expect, test } from 'vitest';
import { Type } from '@sinclair/typebox';
import {
  generateStmInput,
  parseStmInput,
  toKeyedJsonGrammar,
  type GrammarDefinition,
} from '../src/index.js';

const grammar = {
  attack: [
    ['playerId', Type.Integer()],
    ['moveId', Type.Integer()],
  ],
  switchMap: [['mapId', Type.String()]],
} as const satisfies GrammarDefinition;
const keyedJsonGrammar = toKeyedJsonGrammar(grammar);

describe('Generate grammar', () => {
  test('generate input', () => {
    const inputData = generateStmInput(grammar, 'attack', {
      playerId: 1,
      moveId: 2,
    });
    expect(inputData).toStrictEqual(['attack', 1, 2]);
  });

  test('parse input', () => {
    const inputData = parseStmInput('["attack",1,2]', grammar, keyedJsonGrammar);
    expect(inputData.prefix).toStrictEqual('attack');
    expect(inputData.grammar).toStrictEqual(keyedJsonGrammar.attack);
    expect(inputData.data).toStrictEqual({ playerId: 1, moveId: 2 });
  });
});
