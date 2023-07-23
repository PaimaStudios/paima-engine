import { describe, expect, test } from '@jest/globals';
import { PaimaParser } from '../src/PaimaParser';

const myGrammar = `
  arrayCommand = a|array?
  arrayCommandNumber = b|array
  arrayCommandExtra = z|text|array?
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
    array: PaimaParser.ArrayParser<string>({ item: PaimaParser.RegexParser(/[a-z]/) }),
  },
};

describe('Test Array Commands', () => {
  const startTest = (inputs: [string, boolean, any?][]): void => {
    const parser = new PaimaParser(myGrammar, parserCommands);
    inputs.forEach((i: [string, boolean, any?]) => {
      const testCase = i[0];
      const isParseable = i[1];
      const referenceParse = i[2];

      test(`${testCase} to be ${isParseable}`, () => {
        let value;
        try {
          value = parser.start(testCase);
          expect(!!value).toBe(isParseable);
        } catch (e) {
          expect(false).toBe(isParseable);
        }
        if (referenceParse) {
          expect(value).toStrictEqual(referenceParse);
        }
      });
    });
  };

  startTest([
    // Array examples
    ['a|hello,world', true, { command: 'arrayCommand', args: { array: ['hello', 'world'] } }],
    ['a|hello', true],
    ['a|', true, { command: 'arrayCommand', args: { array: [] } }],
    ['a|0,1', true, { command: 'arrayCommand', args: { array: ['0', '1'] } }],
    ['a|1', true],
    ['a|2', false],
    ['a|HELLO,WORLD', false],
    ['a|HELLO', false],

    // Numeric Array examples
    ['b|hello,world', false],
    ['b|hello', false],
    ['b|1,99', true, { command: 'arrayCommandNumber', args: { array: [1, 99] } }],
    ['b|0', true],
    ['b|', false],
    ['b|101', false],

    // Extra
    ['z|hello,world', false],

    [
      'z|extra|hello,world',
      true,
      { command: 'arrayCommandExtra', args: { text: 'extra', array: ['hello', 'world'] } },
    ],
    [
      'z|extra|hello',
      true,
      { command: 'arrayCommandExtra', args: { text: 'extra', array: ['hello'] } },
    ],
    ['z|extra|', true, { command: 'arrayCommandExtra', args: { text: 'extra', array: [] } }],
  ]);
});
