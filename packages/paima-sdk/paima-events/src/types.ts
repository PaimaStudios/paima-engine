import { Kind, Type } from '@sinclair/typebox';
import type { TTuple, TLiteral, TObject, Static, TSchema } from '@sinclair/typebox';
import { PaimaEventBrokerNames } from './builtin-event-utils';
import assertNever from 'assert-never';

/**
 * Name inspired from https://docs.aws.amazon.com/whitepapers/latest/designing-mqtt-topics-aws-iot-core/mqtt-design-best-practices.html#:~:text=Since%20MQTT%20topics%20are%20case,when%20creating%20each%20topic%20level
 */
export enum TopicPrefix {
  Batcher = 'batcher',
  Stf = 'stf',
  Game = 'game',
}

/**
 * ============================
 * Define paths for MQTT topics
 * ============================
 */

export type SimplePath = string;
export type ArgPath = { name: string; type: TSchema };
export type EventPath = (SimplePath | ArgPath)[];

/**
 * ===================================================
 * Define the dev-friendly event log definition format
 * ===================================================
 */

export type LogEventInputs<Schema extends TSchema> = {
  indexed: boolean;
  name: string;
  type: Schema;
};
export type LogEvent<Inputs extends LogEventInputs<any>[]> = {
  name: string;
  inputs: Inputs;
};

/**
 * ==============================================
 * Define the MQTT topic path + event type format
 * ==============================================
 */

export type EventPathAndDef = {
  path: EventPath;
  broker: PaimaEventBrokerNames;
  type: TObject;
};

/**
 * ============================================================
 * Transform paths into TS objects that can be partially filled
 * ============================================================
 */

// 1) Filter out all "simple" types, as they don't require any user input
type FilterSimple<T> = T extends SimplePath ? never : T;
type RemoveAllSimple<T extends EventPath> = T extends (infer U)[] ? FilterSimple<U>[] : never;
// 2) Turn the { name, type } pairs into { [name]: type } pairs aggregated as an object
//    Note: this is also resolving TSchema into TS types using Static<..>
type KeypairToObj<T extends { name: string; type: any }[]> = {
  [K in T[number] as K['name']]: Static<K['type']>;
};
// 3) Wrapper to apply transformations (1) and (2) together
export type ResolvedPath<Path extends EventPath> = KeypairToObj<RemoveAllSimple<Path>>;
// 4) Allow undefined types, as undefined -> + wildcard MQTT notation
export type Undefined<T extends Record<string, any>> = {
  [P in keyof T]: T[P] | undefined;
};
// 5) Wrapper to apply transformations (3) and (4) together
//    Note: Partial since unspecified types are also treated as undefined
export type UserFilledPath<Path extends EventPath> = Partial<Undefined<ResolvedPath<Path>>>;

/**
 * ======================================================================
 * Transform dev-friendly event type to typebox Schema for easy exporting
 * ======================================================================
 */

// Turn LogEventInputs into typebox object types
type ToTObject<T extends Record<string, LogEventInputs<any>>> = {
  -readonly [P in keyof T]: TObject<{
    indexed: TLiteral<T[P]['indexed']>;
    name: TLiteral<T[P]['name']>;
    type: T[P]['type'];
  }>;
};

/**
 * Typebox doesn't provide the right interface for convert into a Tuple
 * So we provide our own wrapper here, then convert it to a proper Tuple later
 */
export type CustomTuple<T> = T extends TSchema[]
  ? TSchema & {
      [Kind]: 'Tuple';
      static: {
        [K in keyof T]: T[K] extends TSchema ? Static<T[K], TSchema['params']> : T[K];
      };
      type: 'array';
      items?: T;
      additionalItems?: false;
      minItems: number;
      maxItems: number;
    }
  : never;
// Convert our custom Tuple type into a typebox TTuple type
type AsTuple<T extends TSchema> = T extends TTuple<infer U> ? TTuple<U> : never;

export function toSchema<T extends LogEvent<any>>(
  event: T
): TObject<{
  name: TLiteral<T['name']>;
  inputs: AsTuple<CustomTuple<ToTObject<T['inputs']>>>;
}> {
  return Type.Object({
    name: Type.Literal(event.name),
    inputs: Type.Tuple(
      event.inputs.map((input: any) =>
        Type.Object({
          indexed: Type.Literal(input.indexed),
          name: Type.Literal(input.name),
          type: input.type,
        })
      ) as T['inputs'] // map(..) converts it to an array, but we need to consider it a tuple
    ),
  }) as any; // typescript can't really know this dynamic object matches our static type
}

/**
 * =======================================================
 * Transform dev-friendly event type to MQTT-friendly type
 * =======================================================
 */

// 1) Filter by entries that are "indexed" as they need to go in the path
type FilterIndexed<T> = T extends { indexed: true } ? T : never;
type RemoveAllUnindexed<T extends LogEventInputs<TSchema>[]> = {
  [P in keyof T]: FilterIndexed<T[P]>;
};
// 2) Transform the types into ArgPath
type TransformEventInput<T> = T extends { readonly name: infer N; readonly type: infer U }
  ? { name: N; type: U }
  : never;
type TransformAllEventInput<T extends LogEventInputs<TSchema>[]> = {
  [P in keyof T]: TransformEventInput<T[P]>;
};

// 3) Exclude tuple values. This is useful to remove `never` types created by object mapping
// ex: T extends { indexed: true } ? T : never;
type ExcludeFromTuple<T extends readonly any[], E> = T extends [infer F, ...infer R]
  ? [F] extends [E]
    ? ExcludeFromTuple<R, E>
    : [F, ...ExcludeFromTuple<R, E>]
  : [];

// 4) add SimplePath with the same name in front of each ArgPath
type AddStringPath<T extends any[]> = T extends [
  { name: infer Name; type: infer Type },
  ...infer Rest,
]
  ? [Name, { name: Name; type: Type }, ...AddStringPath<Rest>]
  : [];

// 5) Filter by entries that are not "indexed" as they need to go in the output
type FilterNonIndexed<T> = T extends { indexed: false } ? T : never;
type RemoveAllIndexed<T extends LogEventInputs<TSchema>[]> = {
  [P in keyof T]: FilterNonIndexed<T[P]>;
};
// 6) Merge the type together into a single object
type OutputKeypairToObj<T> = T extends { name: string; type: any }[]
  ? {
      [K in T[number] as K['name']]: K['type'];
    }
  : never; // not sure why this never is needed. Maybe ExcludeFromTuple isn't perfect

// 7) Map the prefix to the broker type
type BrokerName<T extends TopicPrefix> = T extends TopicPrefix.Batcher
  ? PaimaEventBrokerNames.Batcher
  : PaimaEventBrokerNames.PaimaEngine;

export function toPath<T extends LogEvent<LogEventInputs<TSchema>[]>, Prefix extends TopicPrefix>(
  prefix: Prefix,
  event: T
): {
  path: AddStringPath<
    ExcludeFromTuple<TransformAllEventInput<RemoveAllUnindexed<T['inputs']>>, never>
  >;
  broker: BrokerName<Prefix>;
  type: TObject<
    OutputKeypairToObj<
      ExcludeFromTuple<TransformAllEventInput<RemoveAllIndexed<T['inputs']>>, never>
    >
  >;
} {
  return {
    path: [
      prefix,
      ...event.inputs
        .filter(input => input.indexed)
        .map(input => ({
          name: input.name,
          type: input.type,
        })),
    ],
    broker: (() => {
      switch (prefix) {
        case TopicPrefix.Batcher:
          return PaimaEventBrokerNames.Batcher;
        case TopicPrefix.Stf:
          return PaimaEventBrokerNames.PaimaEngine;
        case TopicPrefix.Game:
          return PaimaEventBrokerNames.PaimaEngine;
        default:
          assertNever(prefix);
      }
    })(),
    type: Type.Object(
      event.inputs
        .filter(input => !input.indexed)
        .reduce(
          (acc, curr) => {
            acc[curr.name] = curr.type;
            return acc;
          },
          {} as Record<string, TSchema>
        )
    ),
  } as any; // typescript can't really know this dynamic object matches our static type
}

// These two just type-check the user provided object for them instead of requiring the `satisfies` keyword
type Ensure<T extends LogEvent<LogEventInputs<TSchema>[]>, U> =
  LogEvent<LogEventInputs<TSchema>[]> extends U ? T : never;
export function genEvent<T extends LogEvent<LogEventInputs<TSchema>[]>>(
  event: Ensure<T, LogEvent<any>>
): T {
  return event as any;
}
