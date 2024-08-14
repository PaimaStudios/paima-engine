import type { LogEvent, LogEventFields } from './types.js';
import type { genEvent } from './types.js';
import { toPath, TopicPrefix } from './types.js';
import type { TSchema, Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { keccak_256 } from 'js-sha3';

export function toSignature<T extends LogEvent<LogEventFields<TSchema>[]>>(event: T): string {
  return event.name + '(' + event.fields.map(f => f.type.type).join(',') + ')';
}

export function toTopicHash<T extends LogEvent<LogEventFields<TSchema>[]>>(event: T): string {
  return keccak_256(toSignature(event));
}

// this generates the type for the events import.
export const generateAppEvents = <
  const T extends ReadonlyArray<LogEvent<LogEventFields<TSchema>[]>>,
>(
  entries: T
): {
  [K in T[number] as K['name']]: (ReturnType<typeof toPath<K, typeof TopicPrefix.App>> & {
    definition: T[0];
    topicHash: string;
  })[];
} => {
  let result: Record<string, any> = {}; // we can't know the type here
  for (const event of entries) {
    if (!result[event.name]) {
      result[event.name] = [];
    }

    result[event.name].push({
      ...toPath(TopicPrefix.App, event),
      // keep the original definition around since it's nicer to work with, it
      // also has the advantage that it allows recovering the initial order in
      // case the signature/topicHash needs to be computed again, which can't be
      // done from the path (since you don't know which non indexed fields go in
      // between each indexed field).
      definition: event,
      // we add this to avoid having to re-compute it all the time.
      topicHash: toTopicHash(event),
    });
  }
  return result as any;
};

// create payload for the stf from an object.
export function createEventForStf<T extends ReturnType<typeof genEvent>>(
  address: `0x${string}`,
  event: T,
  fields: KeypairToObj<T['fields']>
): {
  address: `0x${string}`;
  data: { name: string; fields: KeypairToObj<T['fields']>; topic: string };
} {
  return { address, data: { name: event.name, fields, topic: toTopicHash(event) } };
}

// sum type for all the overloads of a fixed event name
type UnionForOverloadedEvents<
  T extends ReadonlyArray<LogEvent<LogEventFields<TSchema>[]>>,
  N extends string,
> = T extends (infer U)[]
  ? U extends { name: N; fields: infer V }
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      V extends { name: string; type: any }[]
      ? KeypairToObj<V>
      : never
    : never
  : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type KeypairToObj<T extends { name: string; type: any }[]> = {
  [K in T[number] as K['name']]: Static<K['type']>;
};

type EmitFunction<
  T extends ReadonlyArray<LogEvent<LogEventFields<TSchema>[]>>,
  Name extends string,
> = {
  emit: (name: Name, address: `0x${string}`, fields: UnionForOverloadedEvents<T, Name>) => void;
};

type EventQueue<T extends ReadonlyArray<LogEvent<LogEventFields<TSchema>[]>>> = EmitFunction<
  T,
  T[number]['name']
> & {
  get: () => {
    address: `0x${string}`;
    data: { name: string; fields: KeypairToObj<T[number]['fields']>; topic: string };
  }[];
};

// Typed stateful builder that handles overloaded topics. There is a performance
// cost of using this, since it dinamically finds the matching overloaded topic
// from the provided fields, but this way there is no need to use indexing to
// provide the right event type. If this is a concern then the other helper
// function can be used to explicitly provide the event type.
//
// This is supposed meant to be used like this (pseudo-code):
//
// const eventsDefinitions = [
//   genEvent({ name: 'A', fields: fields1 }),
//   genEvent({ name: 'B', fields: fields2 }),
//   genEvent({ name: 'B', fields: fields3 }),
// ] as const;
//
// const queueFactory = eventQueueFactory(eventsDefinitions);
// const queue = queueFactory.empty();
//
// queue.emit('A', data1);
// queue.emit('B', data2);
// queue.emit('B', data3);
//
// return { events: queue, stateTransitions: {...}};
//
// Where data2 and data3 may be different types (for the two overloaded
// definitions), and the return type is that of the stf.
export function eventQueueFactory<
  const T extends ReadonlyArray<LogEvent<LogEventFields<TSchema>[]>>,
>(arr: readonly [...T]): { empty: () => EventQueue<T> } {
  const prototype: Partial<EmitFunction<T, T[number]['name']>> = {};

  const topicSearch = {} as Record<
    T[number]['name'],
    { topic: string; check: (fields: UnionForOverloadedEvents<T, string>) => boolean }[]
  >;

  arr.forEach((type: T[number]) => {
    const name: T[number]['name'] = type.name;
    if (!topicSearch[name]) {
      topicSearch[name] = [];
    }

    const topics = topicSearch[name];

    topics.push({
      topic: toTopicHash(type),
      check: (fields: UnionForOverloadedEvents<T, string>) => {
        const fieldsMatch = type.fields.every(definition => {
          const value = fields[definition.name];

          return value && Value.Check(definition.type, value);
        });

        const noExtraFields = Object.keys(fields).length === type.fields.length;

        return fieldsMatch && noExtraFields;
      },
    });
  });

  prototype.emit = function (name, address, fields): void {
    const topics = topicSearch[name];

    let topic;
    // Go backwards to find the 'latest' overload, assuming that new events
    // get always added at the end. Generally there shouldn't be more than one
    // match, but it's technically possible if the types are unions.
    for (let i = topics.length - 1; i >= 0; i--) {
      if (topics[i].check(fields)) {
        topic = topics[i].topic;
        break;
      }
    }

    if (!topic) {
      // this shouldn't really happen because of the static typing, but it
      // can't be inferred.
      // it technically can also happen if there are extra fields, since
      // typescript doesn't guarantee that.
      throw new Error('Data does not match any event definition');
    }

    // @ts-expect-error: the prototype doesn't have a buffer, but it's not
    // supposed to be used directly.
    const buffer = this.buffer;

    buffer.push({ address, data: { name, fields, topic } });
  };

  return {
    empty: (): EventQueue<T> => {
      const obj = Object.create(prototype);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const buffer = [] as any;

      obj.buffer = buffer;
      obj.get = (): {
        address: `0x${string}`;
        data: { name: string; fields: KeypairToObj<T[number]['fields']>; topic: string };
      } => {
        return buffer;
      };

      return obj;
    },
  };
}
