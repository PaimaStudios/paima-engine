import type { LogEvent, LogEventFields } from './types.js';
import type { genEvent } from './types.js';
import { toPath, TopicPrefix } from './types.js';
import type { TSchema, Static } from '@sinclair/typebox';
import { keccak_256 } from 'js-sha3';

type Data<T extends LogEvent<LogEventFields<TSchema>[]>> = {
  name: T['name'];
  fields: KeypairToObj<T['fields']>;
  topic: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AllEventsUnion<T extends ReadonlyArray<any>> = {
  [K in keyof T]: Data<T[K]>;
}[number];

type ValueArray<T> = T extends { [K in keyof T]: infer U } ? U[] : never;
export type EventQueue<T extends Record<string, LogEvent<LogEventFields<TSchema>[]>>> = {
  address: `0x${string}`;
  data: AllEventsUnion<ValueArray<T>>;
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

type RegisteredEvent<T extends LogEvent<LogEventFields<TSchema>[]>> = ReturnType<
  typeof toPath<T, typeof TopicPrefix.App>
> & {
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
export const encodeEventForStf = <T extends ReturnType<typeof genEvent>>(args: {
  from: `0x${string}`;
  topic: T;
  data: KeypairToObj<T['fields']>;
}): {
  address: `0x${string}`;
  data: { name: T['name']; fields: KeypairToObj<T['fields']>; topic: string };
} => {
  return {
    address: args.from,
    data: { name: args.topic.name, fields: args.data, topic: toSignatureHash(args.topic) },
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type KeypairToObj<T extends { name: string; type: any }[]> = {
  [K in T[number] as K['name']]: Static<K['type']>;
};
