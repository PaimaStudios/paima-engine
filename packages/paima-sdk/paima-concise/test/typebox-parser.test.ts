import { describe, expect, test } from 'vitest';
import { PaimaParser } from '../src/PaimaParser.js';
import { decodeFromBarSeparated } from '../src/index.js';

describe('Parse content', () => {
  test(`JSON object`, () => {
    const content = `{ "bar": "}", "baz": { "zzz": 3 } }|asdfasdf`;
    let value = decodeFromBarSeparated(content);
    expect([JSON.parse(value[0]), value[1]]).toStrictEqual([
      {
        bar: '}',
        baz: { zzz: 3 },
      },
      'asdfasdf',
    ]);
  });
  test(`Empty object`, () => {
    const content = `asdf||zxcv`;
    let value = decodeFromBarSeparated(content);
    expect(value).toStrictEqual(['asdf', '', 'zxcv']);
  });
  test(`Quoted string`, () => {
    const content = `asdf|${JSON.stringify('a"b|c')}|zxcv`;
    let value = decodeFromBarSeparated(content);
    expect(value).toStrictEqual(['asdf', `"a\\"b|c"`, 'zxcv']);
  });
});
