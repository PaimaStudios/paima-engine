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

export type EventQueue<T extends ReadonlyArray<LogEvent<LogEventFields<TSchema>[]>>> = {
  address: `0x${string}`;
  data: AllEventsUnion<T>;
}[];

export const toSignature = <T extends LogEvent<LogEventFields<TSchema>[]>>(event: T): string => {
  return event.name + '(' + event.fields.map(f => f.type.type).join(',') + ')';
};

export const toSignatureHash = <T extends LogEvent<LogEventFields<TSchema>[]>>(
  event: T
): string => {
  return keccak_256(toSignature(event));
};

export type AppEvents = ReturnType<typeof generateAppEvents>;

// this generates the type for the events import.
export const generateAppEvents = <T extends ReadonlyArray<LogEvent<LogEventFields<TSchema>[]>>>(
  entries: T
): {
  [K in T[number] as K['name']]: (ReturnType<typeof toPath<K, typeof TopicPrefix.App>> & {
    definition: T[0];
    topicHash: string;
  })[];
} => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: Record<string, any> = {}; // we can't know the type here
  for (const event of entries) {
    if (!result[event.name]) {
      result[event.name] = [];
    }
    const topicHash = toSignatureHash(event);

    result[event.name].push({
      ...toPath(TopicPrefix.App, event, topicHash),
      // keep the original definition around since it's nicer to work with, it
      // also has the advantage that it allows recovering the initial order in
      // case the signature/topicHash needs to be computed again, which can't be
      // done from the path (since you don't know which non indexed fields go in
      // between each indexed field).
      definition: event,
      // we add this to avoid having to re-compute it all the time.
      topicHash,
    });
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
