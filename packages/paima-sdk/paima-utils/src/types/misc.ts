export type Hash = string;
export type URI = string;
export type UserSignature = string;

export type VersionString = `${number}.${number}.${number}`;

export type TransactionTemplate = {
  data: string;
  to: string;
  gasPrice: string;
};

/**
 * @description Combines members of an intersection into a readable type.
 *
 * @see {@link https://twitter.com/Riyaadh_Abr/status/1622736576303312899/photo/1}
 * @example
 * MergeIntersects<{ a: string } & { b: string } & { c: number, d: bigint }>
 * => { a: string, b: string, c: number, d: bigint }
 */
export type MergeIntersects<T> = T extends
  | Record<string, unknown>
  | readonly Record<string, unknown>[]
  ? T extends infer Obj
    ? { [K in keyof Obj]: MergeIntersects<Obj[K]> }
    : never
  : T;

/**
 * Same as the above, but shallow (not recursive)
 * This is useful if you don't want Typescript to expand an underlying type
 *
 * ex: avoid { foo: FooType } turning into { foo: { a: string, b: string } }
 */
export type ShallowMergeIntersects<T> = {
  [K in keyof T]: T[K];
} & {};

export type NoUndefinedField<T> = { [P in keyof T]-?: NonNullable<T[P]> };
