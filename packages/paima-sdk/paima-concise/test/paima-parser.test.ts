import { describe, expect, test } from '@jest/globals';
import { PaimaParser, PaimaParserError } from '../src/PaimaParser';

const myGrammar = `
createLobby         = c|numOfRounds|roundLength|isHidden?|isPractice?
joinedLobby         = j|*lobbyID
closeLobby          = cs|*lobbyID
moves               = s|*lobbyID|roundNumber|move_rps
zombieScheduledData = z|*lobbyID
userScheduledData   = u|*user|result
userAlt             = @u|result
generic             = g|json
`;

const parserCommands = {
  createLobby: {
    numOfRounds: PaimaParser.NumberParser(3, 1000),
    roundLength: PaimaParser.DefaultRoundLength(parseInt(process.env.BLOCK_TIME || '4', 0)),
    isHidden: PaimaParser.TrueFalseParser(false),
    isPractice: PaimaParser.TrueFalseParser(false),
  },
  joinedLobby: {
    lobbyID: PaimaParser.NCharsParser(12, 12),
  },
  closeLobby: {
    lobbyID: PaimaParser.NCharsParser(12, 12),
  },
  moves: {
    lobbyID: PaimaParser.NCharsParser(12, 12),
    roundNumber: PaimaParser.NumberParser(1, 1000),
    move_rps: PaimaParser.RegexParser(/^[RPS]$/),
  },
  zombieScheduledData: {
    renameCommand: 'scheduledData',
    lobbyID: PaimaParser.NCharsParser(12, 12),
  },
  userScheduledData: {
    renameCommand: 'scheduledData',
    user: PaimaParser.WalletAddress(),
    result: PaimaParser.RegexParser(/^[w|t|l]$/),
  },
  userAlt: {
    renameCommand: 'scheduledData',
    result: PaimaParser.RegexParser(/^[w|t|l]$/),
  },
  generic: {
    json: PaimaParser.NCharsParser(0, 99999999),
  },
};

describe('Test if parsed', () => {
  const startTest = (inputs: [string, boolean][]): void => {
    const parser = new PaimaParser(myGrammar, parserCommands);
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
    ['c|3|100||', true],
    ['c|3|100|T|F', true],
    ['c|1|100|T|F', false],
    ['c|3|1|T|F', false],
    ['c|x|1|T|F', false],
    ['c|x|1|X|F', false],
    ['c|5|100||T', true],
    ['c|5|100|T|', true],

    ['j|1234', false],
    ['j|', false],
    ['j|1234|', false],
    ['j|()', false],
    ['j|*123456123456', true],
    ['j|*123456abcdef', true],
    ['j|*123456ABCDEF', true],
    ['j|*123456ABCDE', false],
    ['j|*123456ABCDEFG', false],

    ["j|*e what's hid", true],
    ['j|*den in your ', true],
    ['j|*g… r b e​hd﻿', true],

    ['cs|1234', false],
    ['cs|', false],
    ['cs|1234|', false],
    ['cs|()', false],
    ['cs|*123456123456', true],
    ['cs|*123456abcdef', true],
    ['cs|*123456ABCDEF', true],
    ['cs|*123456ABCDE', false],
    ['cs|*123456ABCDEFG', false],
    ['cx|*123456ABCDEF', false],

    ['s|*123456123456|1|R', true],
    ['s|*123456abcdef|2|P', true],
    ['s|*123456ABCDEF|3|S', true],
    ['s|*123456ABCDE', false],
    ['s|*123456ABCDEFG', false],
    ['s|*123456ABCDEF', false],
    ['s|*123456123456|100000|R', false],
    ['s|*123456abcdef|2|p', false],
    ['s|*123456ABCDEF|3|X', false],

    ['z|1234', false],
    ['z|', false],
    ['z|1234|', false],
    ['z|()', false],
    ['z|*123456123456', true],
    ['z|*123456abcdef', true],
    ['z|*123456ABCDEF', true],
    ['z|*123456ABCDE', false],
    ['z|*123456ABCDEFG', false],

    ['u|1234|w', false],
    ['u|*0x1234|M', false],
    ['u|*0x1234|', false],
    ['u|0x1234|w', false],
    ['u|0xabcd|t', false],
    ['u|0x0000|l', false],
    ['u|0x123m|w', false],
    ['u|*0x1234|w', true],
    ['u|*0xabcd|t', true],
    ['u|*0x0000|l', true],
    ['u|*addr_test1qqpftzcepsz6x4e|l', true],

    ['@u|1234|w', false],
    ['@u|*0x1234|M', false],
    ['@u|*0x1234|', false],
    ['@u|0x1234|w', false],
    ['@u|0xabcd|t', false],
    ['@u|0x0000|l', false],
    ['@u|0x123m|w', false],
    ['@u|*0x1234|w', false],
    ['@u|*0xabcd|t', false],
    ['@u|*0x0000|l', false],

    ['@u|W', false],
    ['@u|M', false],
    ['@u|', false],
    ['@u|w', true],
    ['@u|t', true],
    ['@u|l', true],

    [
      'g|{"0":"4700000000000000000","1":"0x54dc4C0E0fa8887ABA529E4EfEf00b243D762a80","2":"pack","amount":"4700000000000000000","payer":"0x54dc4C0E0fa8887ABA529E4EfEf00b243D762a80","message":"pack"}',
      true,
    ],
  ]);
});
