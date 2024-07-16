import { Type } from '@sinclair/typebox';
import type { Static, TSchema } from '@sinclair/typebox';
import { PaimaEventBrokerNames } from './event-utils';

export type SimplePath = string;
export type ArgPath = { name: string; type: TSchema };
export type EventPath = (SimplePath | ArgPath)[];
export type EventPathAndDef = {
  path: EventPath;
  broker: PaimaEventBrokerNames;
  type: TSchema;
};

/**
 * Name inspired from https://docs.aws.amazon.com/whitepapers/latest/designing-mqtt-topics-aws-iot-core/mqtt-design-best-practices.html#:~:text=Since%20MQTT%20topics%20are%20case,when%20creating%20each%20topic%20level
 */
export enum TopicPrefix {
  Batcher = 'batcher',
  Stf = 'stf',
  Game = 'game',
}

export const BuiltinEvents = {
  BatcherHash: {
    path: [TopicPrefix.Batcher, { name: 'batchHash', type: Type.String() }],
    broker: PaimaEventBrokerNames.Batcher,
    type: Type.Object({
      input_hash: Type.String(),
      block_height: Type.Integer(),
      transaction_hash: Type.String(),
    }),
  },
  RollupBlock: {
    path: [TopicPrefix.Stf, 'block', { name: 'blockId', type: Type.Integer() }],
    broker: PaimaEventBrokerNames.PaimaEngine,
    type: Type.Object({
      blockHeight: Type.Integer(),
      emulated: Type.Union([Type.Undefined(), Type.Integer()]),
    }),
  },
} as const satisfies Record<string, EventPathAndDef>;

type FilterSimple<T> = T extends SimplePath ? never : T;
type RemoveAllSimple<T extends EventPath> = T extends (infer U)[] ? FilterSimple<U>[] : never;
type KeypairToObj<T extends { name: string; type: any }[]> = {
  [K in T[number] as K['name']]: Static<K['type']>;
};
// undefined -> + wildcard MQTT notation
export type Undefined<T extends Record<string, any>> = {
  [P in keyof T]: T[P] | undefined;
};
export type ResolvedPath<Path extends EventPath> = KeypairToObj<RemoveAllSimple<Path>>;

/**
 * Creates an MQTT path filling in specified variables in the path
 * @param path the base MQTT path to use
 * @param args the args to fill the path.
 * - `undefined` (explicitly or omitted) variables will be treated as `+`
 * - if all trailing variables are `undefined`, it will be replaced by `#`
 * @returns
 */
export function fillPath<Path extends EventPath>(
  path: Path,
  args: Partial<Undefined<ResolvedPath<Path>>>
) {
  const keys = new Set(Object.keys(args));

  const possibleArgs = path
    .map((p, index) => [p, index])
    .filter(([p, _]) => typeof p === 'object')
    .map(([_, index]) => index as number);
  const filledArgsLeft = path
    .map((p, index) => [p, index])
    .filter(([p, _]) => typeof p === 'object' && keys.has(p.name))
    .map(([_, index]) => index)
    .reverse(); // reverse as pop() is more efficient than removing from the start of the array

  let filledPath = [];

  const addLastArg = (i: number): void => {
    if (i === path.length - 1) {
      // if it's the last entry, + and # mean the same thing
      // so we just pick +
      filledPath.push('+');
    } else {
      filledPath.push('#');
    }
  };

  for (let i = 0; i < path.length; i++) {
    const entry = path[i];

    // if we've exhausted all args provided by the user
    // but there are still args we expect later in the path
    // ex:
    // 1: a/{foo}/b/{bar}, user provides just `foo` and we've already processed it
    // 2: a/{foo}, user provided nothing
    if (
      filledArgsLeft.length === 0 &&
      possibleArgs.length > 0 &&
      i < possibleArgs[possibleArgs.length - 1]
    ) {
      // if we've reached at least the first argument
      // ex: a/{foo}, we should use `a/+` instead of just `#`
      if (i >= possibleArgs[0]) {
        addLastArg(i);
        break;
      }
    }

    // 1) handle regular string types
    {
      if (typeof entry === 'string') {
        filledPath.push(path[i]);
        continue;
      }
    }
    // 2) handle arg types
    {
      // handle types left undefined despite future args being specified
      if (args[entry.name as keyof typeof args] === undefined) {
        filledPath.push('+');
      } else {
        // handle types explicitly provided
        filledPath.push(args[entry.name as keyof typeof args]);
      }

      // if we've reached the next arg the user provided a filling for
      if (filledArgsLeft.length > 0 && i === filledArgsLeft[filledArgsLeft.length - 1]) {
        filledArgsLeft.pop();
      }
    }
  }
  return filledPath.join('/');
}

/**
 * Convert our internal definition of an event path to an mqtt-pattern compatible path
 * This is useful to later deconstruct topics for pattern matching
 */
export function toPattern(path: EventPath) {
  let result = '';
  for (const entry of path) {
    if (typeof entry === 'string') {
      result += entry;
    } else {
      result == `+${entry.name}`;
    }
  }
  return result;
}
