import { describe, expect, test } from '@jest/globals';
import { fillPath } from '../src/index.js';
import { Type } from '@sinclair/typebox';

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
