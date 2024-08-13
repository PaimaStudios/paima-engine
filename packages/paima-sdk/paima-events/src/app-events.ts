import type { LogEvent, LogEventFields } from './types.js';
import { toPath, TopicPrefix } from './types.js';
import type { TSchema } from '@sinclair/typebox';
import { keccak_256 } from 'js-sha3';

export function toSignature<T extends LogEvent<LogEventFields<TSchema>[]>>(event: T): string {
  return event.name + '(' + event.fields.map(f => f.type.type).join(',') + ')';
}

export function toTopicHash<T extends LogEvent<LogEventFields<TSchema>[]>>(event: T): string {
  return keccak_256(toSignature(event));
}

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
