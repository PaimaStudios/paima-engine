import { describe, expect, test } from '@jest/globals';
import { PaimaParser } from '../src/parser/PaimaParser';

const myGrammar = `
  join = j|x|number?|number_?
`;

const parserCommands = {
  join: {
    x: PaimaParser.NCharsParser(0, 100),
    number: PaimaParser.OptionalParser(111, PaimaParser.NumberParser()),
    number_: PaimaParser.OptionalParser(333, PaimaParser.NumberParser()),
  },
};

describe('Test optional commands', () => {
  const startTest = (inputs: [string, boolean, number, number][]): void => {
    const parser = new PaimaParser(myGrammar, parserCommands);
    inputs.forEach((i: [string, boolean, number, number]) => {
      test(`${i[0]} to be ${i[1]}`, () => {
        try {
          const value = parser.start(i[0]);
          expect(value.args.number).toBe(i[2]);
          expect(value.args.number_).toBe(i[3]);
          expect(!!value).toBe(i[1]);
        } catch (e) {
          expect(false).toBe(i[1]);
        }
      });
    });
  };

  startTest([
    ['j|x||', true, 111, 333],
    ['j|x|222|', true, 222, 333],
    ['j|x||444', true, 111, 444],
    ['j|x|666|555', true, 666, 555],
  ]);
});
