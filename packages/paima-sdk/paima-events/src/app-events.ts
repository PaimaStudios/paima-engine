import type {
  ArgPath,
  BrokerName,
  ExcludeFromTuple,
  LogEvent,
  LogEventFields,
  OutputKeypairToObj,
  RemoveAllIndexed,
  TransformAllEventInput,
} from './types.js';
import { toPath, TopicPrefix } from './types.js';
import type { TSchema, Static, TObject } from '@sinclair/typebox';
import { keccak_256 } from 'js-sha3';

type Data<T extends LogEvent<LogEventFields<TSchema>[]>> = {
  name: T['name'];
  fields: KeypairToObj<T['fields']>;
  topic: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AllEventsUnion<T extends Record<string, LogEvent<LogEventFields<TSchema>[]>>> = {
  [K in keyof T]: Data<T[K]>;
};

export type EventQueue<T extends Record<string, LogEvent<LogEventFields<TSchema>[]>>> = {
  address: `0x${string}`;
  data: AllEventsUnion<T>[keyof T];
}[];

export const toSignature = <T extends LogEvent<LogEventFields<TSchema>[]>>(event: T): string => {
  return event.name + '(' + event.fields.map(f => f.type.type).join(',') + ')';
};

export const toSignatureHash = <T extends LogEvent<LogEventFields<TSchema>[]>>(
  event: T
): string => {
  return keccak_256(toSignature(event));
};

export type AppEvents = ReturnType<typeof groupEvents>;

export type RegisteredEvent<T extends LogEvent<LogEventFields<TSchema>[]>> = {
  /**
   * the next three properties are basically the return type of toPath, but
   * using ReturnType for some reason binds path to never[], which makes any
   * assignment fail to typecheck.
   */
  path: (string | ArgPath)[];
  broker: BrokerName<TopicPrefix.App>;
  type: TObject<
    OutputKeypairToObj<
      ExcludeFromTuple<TransformAllEventInput<RemoveAllIndexed<T['fields']>>, never>
    >
  >;
  /**
   * keep the original definition around since it's nicer to work with, it
   * also has the advantage that it allows recovering the initial order in
   * case the signature/topicHash needs to be computed again, which can't be
   * done from the path (since you don't know which non indexed fields go in
   * between each indexed field).
   */
  definition: T;
  /**
   * we add this to avoid having to re-compute it all the time
   */
  topicHash: string;
};
export const registerEvents = <const T extends Record<string, LogEvent<LogEventFields<TSchema>[]>>>(
  entries: T
): {
  [K in keyof T]: RegisteredEvent<T[K]>;
} => {
  return Object.fromEntries(
    Object.keys(entries).map(key => {
      const event = entries[key];
      const topicHash = toSignatureHash(event);
      return [
        key,
        {
          ...toPath(TopicPrefix.App, event, topicHash),
          definition: event,
          topicHash,
        },
      ];
    })
  ) as any; // we can't know the type here
};

/**
 * groups events by their name (essentially, grouping by overloads)
 */
export const groupEvents = <
  T extends Record<string, RegisteredEvent<LogEvent<LogEventFields<TSchema>[]>>>,
>(
  events: T
): {
  [K in T[string] as K['definition']['name']]: T[string][];
} => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: Record<string, any> = {}; // we can't know the type here
  for (const key of Object.keys(events)) {
    const event = events[key];
    if (!result[event.definition.name]) {
      result[event.definition.name] = [];
    }

    result[event.definition.name].push(event);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return result as any;
};

// Create payload for the stf from an object.  Using this allows statically
// checking `data` with the type from `T`.
export const encodeEventForStf = <
  T extends Omit<RegisteredEvent<LogEvent<LogEventFields<TSchema>[]>>, 'path'>,
>(args: {
  from: `0x${string}`;
  topic: T;
  data: KeypairToObj<T['definition']['fields']>;
}): {
  address: `0x${string}`;
  data: {
    name: T['definition']['name'];
    fields: KeypairToObj<T['definition']['fields']>;
    topic: string;
  };
} => {
  return {
    address: args.from,
    data: {
      name: args.topic.definition.name,
      fields: args.data,
      topic: toSignatureHash(args.topic.definition),
    },
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type KeypairToObj<T extends { name: string; type: any }[]> = {
  [K in T[number] as K['name']]: Static<K['type']>;
};
