import { describe, expect, test } from '@jest/globals';
import { PaimaParser, PaimaParserError } from '../src/PaimaParser';

const myGrammar = `
  join = j|lobbyID
`;

const parserCommands = {
  join: {},
};

describe('Test single commands', () => {
  const startTest = (inputs: [string, boolean][]): void => {
    const parser = new PaimaParser(myGrammar, parserCommands, 'foobar');
    inputs.forEach((i: [string, boolean]) => {
      test(`${i[0]} to be ${i[1]}`, () => {
        try {
          const value = !!parser.start(i[0]);
          expect(value).toBe(i[1]);
        } catch (e) {
          if (e instanceof PaimaParserError) {
            expect(false).toBe(i[1]);
          } else {
            throw e;
          }
        }
      });
    });
  };

  startTest([
    ['|foobar|j|T', true],
    ['j|T', false],
    ['j|', false],
    ['j', false],
  ]);
});
