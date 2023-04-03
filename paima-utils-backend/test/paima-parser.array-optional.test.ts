import { describe, expect, test } from '@jest/globals';
import { PaimaParser } from '../src/parser/PaimaParser';

const myGrammar = `
  arrayCommand = a|array,
  optionalCommand = o|first?|second?|third?
`;

const parserCommands = {
  arrayCommand: {
    // PaimaParser.ArrayParser({ item: PaimaParser.RegexParser(/[a-zA-Z]/) }),
  },
  optionalCommand: {
    first: PaimaParser.RegexParser(/[a-zA-Z]/),
    second: PaimaParser.RegexParser(/[a-zA-Z]/),
    third: PaimaParser.RegexParser(/[a-zA-Z]/),
  },
};

describe('Test single commands', () => {
  const startTest = (inputs: [string, boolean][]): void => {
    const parser = new PaimaParser(myGrammar, parserCommands);
    inputs.forEach((i: [string, boolean]) => {
      test(`${i[0]} to be ${i[1]}`, () => {
        try {
          const value = !!parser.start(i[0]);
          expect(value).toBe(i[1]);
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

    // Optional examples
    ['o|paima|parser|demo', true],
    ['o|paima|parser', true],
    ['o|', true],
    ['o', true],
  ]);
});
