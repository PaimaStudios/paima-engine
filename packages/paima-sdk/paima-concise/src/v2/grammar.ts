import { Type } from '@sinclair/typebox';
import { CommandTuples, FullJsonGrammar, GrammarDefinition } from './types.js';

export function toFullJsonGrammar<Grammar extends GrammarDefinition>(grammar: CommandTuples<Grammar>): FullJsonGrammar<Grammar> {
  const tuples = Object.values(grammar);
  return Type.Intersect(tuples) as any;
}
export function toKeyedJsonGrammar<Grammar extends GrammarDefinition>(grammar: Grammar): CommandTuples<Grammar> {
  const keyedTypes = Object.fromEntries(Object.entries(grammar).map(([command, params]) => {
    const paramTypes = params.map(([_, paramType]) => paramType);
    const tupleType = Type.Tuple([Type.Literal(command), ...paramTypes]);
    return [command, tupleType];
  }));
  return keyedTypes as any;
}
