import type { TTuple, TIntersect, TLiteral, Static, TSchema } from '@sinclair/typebox';


export type ExtractParameterTypes<T extends readonly Readonly<[string, TSchema]>[]> = {
  [P in keyof T]: T[P] extends Readonly<[string, infer S extends TSchema]> ? S : never;
};
export type CommandTuples<T extends Record<string, readonly Readonly<[string, TSchema]>[]>> = {
  [K in keyof T]: TTuple<[TLiteral<K & string>, ...ExtractParameterTypes<T[K]>]>;
};

export type GrammarDefinition = Record<string, readonly Readonly<[string, TSchema]>[]>;
export type FullJsonGrammar<Grammar extends GrammarDefinition> = TIntersect<[CommandTuples<Grammar>[keyof Grammar]]>;

export type ParamToData<T extends readonly Readonly<[string, TSchema]>[]> = {
  [K in T[number] as K[0]]: Static<K[1]>;
};

export type ParseInputResult<Grammar extends GrammarDefinition, Prefix extends keyof Grammar> = {
  prefix: Prefix,
  grammar: CommandTuples<Grammar>[Prefix],
  data: ParamToData<Grammar[Prefix]>
}
