import { describe, expect, test } from '@jest/globals';
import { PaimaParser } from '../src/parser/PaimaParser';

const myGrammar = `
  arrayCommand = a|array?
  arrayCommandNumber = b|array
  arrayCommandExtra = z|text|array
`;

const parserCommands = {
  arrayCommand: {
    array: PaimaParser.ArrayParser<string>({ item: PaimaParser.RegexParser(/[a-z0-1]/) }),
  },
  arrayCommandNumber: {
    array: PaimaParser.ArrayParser<number>({ item: PaimaParser.NumberParser(0, 100) }),
  },
  arrayCommandExtra: {
    text: PaimaParser.RegexParser(/[a-z]/),
    array: PaimaParser.ArrayParser<string>({ item: PaimaParser.RegexParser(/[a-z0-1]/) }),
  },
};

describe('Test Array Commands', () => {
  const startTest = (inputs: [string, boolean][]): void => {
    const parser = new PaimaParser(myGrammar, parserCommands);
    inputs.forEach((i: [string, boolean]) => {
      test(`${i[0]} to be ${i[1]}`, () => {
        try {
          const value = parser.start(i[0]);
          expect(!!value).toBe(i[1]);
        } catch (e) {
          expect(false).toBe(i[1]);
        }
      });
    });
  };

  startTest([
    // Array examples
    ['a|hello,world', true],
    ['a|hello', true],
    ['a|', true],
    ['a|0,1', true],
    ['a|1', true],
    ['a|2', false],
    ['a|HELLO,WORLD', false],
    ['a|HELLO', false],

    // Numeric Array examples
    ['b|hello,world', false],
    ['b|hello', false],
    ['b|1,99', true],
    ['b|0', true],
    ['b|', false],
    ['b|101', false],

    // Extra
    ['a|extra|hello,world', true],
    ['a|extra|hello', true],
    ['a|extra|', true],
  ]);
});
