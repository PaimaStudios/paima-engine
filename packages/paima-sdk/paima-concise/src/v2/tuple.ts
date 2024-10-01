import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import type { TTuple, TIntersect, TLiteral, Static, TSchema } from '@sinclair/typebox';


export type ExtractParameterTypes<T extends readonly Readonly<[string, TSchema]>[]> = {
  [P in keyof T]: T[P] extends Readonly<[string, infer S extends TSchema]> ? S : never;
};
export type CommandTuples<T extends Record<string, readonly Readonly<[string, TSchema]>[]>> = {
  [K in keyof T]: TTuple<[TLiteral<K & string>, ...ExtractParameterTypes<T[K]>]>;
};

export type GrammarDefinition = Record<string, readonly Readonly<[string, TSchema]>[]>;
export type FullJsonGrammar<Grammar extends GrammarDefinition> = TIntersect<[CommandTuples<Grammar>[keyof Grammar]]>;

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

export type ParamToData<T extends readonly Readonly<[string, TSchema]>[]> = {
  [K in T[number] as K[0]]: Static<K[1]>;
};

export type ParseInputResult<Grammar extends GrammarDefinition, Prefix extends keyof Grammar> = {
  prefix: Prefix,
  grammar: CommandTuples<Grammar>[Prefix],
  data: ParamToData<Grammar[Prefix]>
}

export function parseInput<Grammar extends GrammarDefinition, Prefix extends keyof Grammar & string>(inputData: string, grammarDefinition: Grammar, keyedJsonGrammar: CommandTuples<Grammar>): ParseInputResult<Grammar, Prefix> {
  const parsedData = JSON.parse(inputData);
  if (typeof parsedData !== 'object') {
    throw new Error(`Input is not valid JSON`);
  }
  if (!Array.isArray(parsedData)) {
    throw new Error(`Input is not a valid JSON array`);
  }
  const prefix = parsedData[0];
  if (typeof prefix !== 'string') {
    throw new Error(`Input does not have a valid prefix`);
  }
  if (!(prefix in keyedJsonGrammar)) {
    throw new Error(`Input has unknown prefix ${prefix}`);
  }
  const parsedInput = Value.Parse(keyedJsonGrammar[prefix], parsedData);

  const parsedInputObj = grammarDefinition[prefix].reduce((acc, [key], idx) => {
    acc[key] = parsedInput[idx + 1];
    return acc;
  }, {} as Record<string, any>);

  return {
    prefix: prefix,
    grammar: keyedJsonGrammar[prefix],
    data: parsedInputObj
  } as any; // typescript can't infer this
}
