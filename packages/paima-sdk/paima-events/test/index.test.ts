import {
  BuiltinHashedEvents,
  toAsyncApi,
  toPathWithHashFromEntries,
} from '../src/builtin-events.js';
import YAML from 'yaml';
import { Type } from '@sinclair/typebox';
import fs from 'fs/promises';
import { genEvent, TopicPrefix } from '../src/types.js';
import { describe, expect, test } from 'vitest';
import { fillPath } from '../src/index.js';

describe('Test if asyncapi is generated correctly', () => {
  test(`Builtin paths generates the right asyncapi yml`, async () => {
    const expected = await fs.readFile(`./test/builtin.yml`, 'utf8');
    expect(
      YAML.stringify(
        toAsyncApi(
          {
            backendUri: 'http://localhost:3333',
            batcherUri: 'http://localhost:1234',
          },
          BuiltinHashedEvents
        ),
        null,
        2
      ).replaceAll('"', "'")
    ).toEqual(expected);
  });

  test(`Hashed object generates the right asyncapi yml`, async () => {
    const expected = await fs.readFile(`./test/hashed.yml`, 'utf8');

    const TestEvent = genEvent({
      name: 'TestEvent',
      fields: [
        {
          name: 'lobby',
          type: Type.Object({
            idPlayer1: Type.Number(),
            idPlayer2: Type.Number(),
          }),
          indexed: true,
        },
        {
          name: 'map',
          type: Type.String(),
          indexed: true,
        },
        {
          name: 'numRounds',
          type: Type.Number(),
        },
      ],
    });
    const TestEvents = toPathWithHashFromEntries([[TopicPrefix.Node, TestEvent]]);
    expect(
      YAML.stringify(
        toAsyncApi(
          {
            backendUri: 'http://localhost:3333',
            batcherUri: 'http://localhost:1234',
          },
          TestEvents
        ),
        null,
        2
      ).replaceAll('"', "'")
    ).toEqual(expected);
  });
});

export const TestEvent = {
  TestPath1: {
    path: [`test`, { name: 'address', type: Type.String() }, { name: 'bar', type: Type.String() }],
    type: Type.Object({}),
  },
  TestPath2: {
    path: [
      `test`,
      { name: 'address', type: Type.String() },
      'foo',
      { name: 'bar', type: Type.String() },
    ],
    type: Type.Object({}),
  },
  TestPath3: {
    path: [
      `test`,
      { name: 'address', type: Type.String() },
      'foo',
      { name: 'bar', type: Type.String() },
      'baz',
    ],
    type: Type.Object({}),
  },
  TestPath4: {
    path: [{ name: 'address', type: Type.String() }],
    type: Type.Object({}),
  },
};
describe('Test if filled path is correct', () => {
  test(`filling paths`, async () => {
    {
      const path = fillPath(TestEvent.TestPath1.path, { address: '5', bar: '4' });
      expect(path).toEqual('test/5/4');
    }
    {
      const path = fillPath(TestEvent.TestPath1.path, { address: '5' });
      expect(path).toEqual('test/5/+');
    }
    {
      const path = fillPath(TestEvent.TestPath1.path, { address: '5', bar: undefined });
      expect(path).toEqual('test/5/+');
    }
    {
      const path = fillPath(TestEvent.TestPath1.path, {});
      expect(path).toEqual('test/#');
    }
    {
      const path = fillPath(TestEvent.TestPath2.path, { address: '5', bar: '4' });
      expect(path).toEqual('test/5/foo/4');
    }
    {
      const path = fillPath(TestEvent.TestPath2.path, { address: '5' });
      expect(path).toEqual('test/5/#');
    }
    {
      const path = fillPath(TestEvent.TestPath2.path, {});
      expect(path).toEqual('test/#');
    }
    {
      const path = fillPath(TestEvent.TestPath3.path, { address: '5', bar: '4' });
      expect(path).toEqual('test/5/foo/4/baz');
    }
    {
      const path = fillPath(TestEvent.TestPath3.path, { address: '5' });
      expect(path).toEqual('test/5/#');
    }
    {
      const path = fillPath(TestEvent.TestPath3.path, {});
      expect(path).toEqual('test/#');
    }
    {
      const path = fillPath(TestEvent.TestPath4.path, { address: '5' });
      expect(path).toEqual('5');
    }
    {
      const path = fillPath(TestEvent.TestPath4.path, {});
      expect(path).toEqual('+');
    }
  });
});
