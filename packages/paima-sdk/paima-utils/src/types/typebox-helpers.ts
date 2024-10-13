import { Type } from '@sinclair/typebox';
import type { RegExpOptions, TUnion, TNull, TSchema, TTransform, TString, SchemaOptions } from '@sinclair/typebox';

export const TypeboxHelpers = {
  EvmAddress: Type.Transform(Type.RegExp(/^0x[a-fA-F0-9]{40}$/))
    .Decode(value => value.toLowerCase())
    .Encode(value => value.toLowerCase()),
  HexString: (options?: RegExpOptions) => Type.RegExp(/^0x[a-fA-F0-9]+$/, options),
  Lowercase: Type.Transform(Type.String())
    .Decode(value => value.toLowerCase())
    .Encode(value => value.toLowerCase()),
  TrueOrFalse: Type.Transform(Type.String())
    .Decode(value => value === 'T')
    .Encode(value => (value ? 'T' : 'F')),
  Nullable: <T extends TSchema>(schema: T, options?: SchemaOptions): TUnion<[T, TNull]> => Type.Union([schema, Type.Null()], options),
  JsonUnsafeCast: <T>(): TTransform<TString, T> =>
    Type.Transform(Type.String())
      .Decode(x => JSON.parse(x) as T)
      .Encode((x: T) => JSON.stringify(x)),
};
