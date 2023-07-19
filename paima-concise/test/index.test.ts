import { describe, expect, test } from '@jest/globals';
import { getSecurityPrefix, checkSecurityPrefix, stripSecurityPrefix } from '../src';

describe('Test if parsed', () => {
  const checkSecurityPrefixTest = (inputs: [string | undefined, string, boolean][]): void => {
    inputs.forEach((i: [string | undefined, string, boolean]) => {
      test(`${i[0]} to prefix ${i[1]}`, () => {
        expect(checkSecurityPrefix(i[0], i[1])).toBe(i[2]);
      });
    });
  };

  checkSecurityPrefixTest([[undefined, 'c|3|100||', true]]);
  checkSecurityPrefixTest([['foobar', 'c|3|100||', false]]);
  checkSecurityPrefixTest([['foobar', '|foobar|c|3|100||', true]]);
  checkSecurityPrefixTest([['foobar', 'c|foobar|3|100||', false]]);

  const getSecurityPrefixTest = (inputs: [string | undefined, string][]): void => {
    inputs.forEach((i: [string | undefined, string]) => {
      test(`${i[0]} to generate prefix ${i[1]}`, () => {
        expect(getSecurityPrefix(i[0])).toBe(i[1]);
      });
    });
  };

  getSecurityPrefixTest([[undefined, '']]);
  getSecurityPrefixTest([['foobar', '|foobar|']]);

  const stripSecurityPrefixTest = (inputs: [string | undefined, string, string][]): void => {
    inputs.forEach((i: [string | undefined, string, string]) => {
      test(`${i[0]} to start with ${i[1]}`, () => {
        expect(stripSecurityPrefix(i[0], i[1])).toBe(i[2]);
      });
    });
  };

  stripSecurityPrefixTest([[undefined, 'c|3|100||', 'c|3|100||']]);
  stripSecurityPrefixTest([['foobar', 'c|3|100||', 'c|3|100||']]);
  stripSecurityPrefixTest([['foobar', '|foobar|c|3|100||', 'c|3|100||']]);
});
