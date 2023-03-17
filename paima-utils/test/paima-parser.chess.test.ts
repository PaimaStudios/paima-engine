import { describe, expect, test } from '@jest/globals';
import { PaimaParser } from '../src/parser/PaimaParser';

const myGrammar = `
createdLobby = c|numOfRounds|roundLength|playTimePerPlayer|isHidden?|isPractice?|playerOneIsWhite?
`;

const parserCommands = {
  createdLobby: {
    numOfRounds: PaimaParser.NumberParser(3, 1000),
    roundLength: PaimaParser.DefaultRoundLength(),
    playTimePerPlayer: PaimaParser.NumberParser(1, 10000),
    isHidden: PaimaParser.TrueFalseParser(false),
    isPractice: PaimaParser.TrueFalseParser(false),
    playerOneIsWhite: PaimaParser.TrueFalseParser(true),
  },
};

describe('Default Values Test', () => {
  const parser = new PaimaParser(myGrammar, parserCommands);
    test(`Defaults Booleans`, () => {
      let value = {};
      try {
        value = parser.start('c|5|100|100|||');
      } catch (e) {}
      expect(value).toStrictEqual({
        command: 'createdLobby',
        args: {
          numOfRounds: 5,
          roundLength: 100,
          playTimePerPlayer: 100,
          isHidden: false,
          isPractice: false,
          playerOneIsWhite: true
        }
      });

    });
    test(`Non Defaults Booleans`, () => {
      let value = {};
      try {
        value = parser.start('c|5|100|100|T|F|F');
      } catch (e) {}
      expect(value).toStrictEqual({
        command: 'createdLobby',
        args: {
          numOfRounds: 5,
          roundLength: 100,
          playTimePerPlayer: 100,
          isHidden: true,
          isPractice: false,
          playerOneIsWhite: false
        }
      });
    });
});
