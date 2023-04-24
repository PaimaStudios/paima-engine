import { describe, expect, test } from '@jest/globals';
import { PaimaParser } from '../src/parser/PaimaParser';

const myGrammar = `
  join = j|base64
  joinArray = a|base64?
`;

const parserCommands = {
  join: {
    base64: PaimaParser.NCharsParser(0, 1000),
  },
  joinArray: {
    base64: PaimaParser.ArrayParser({ item: PaimaParser.NCharsParser(0, 1000) }),
  },
};

describe('Test base64 commands', () => {
  const startTest = (inputs: [string, boolean][]): void => {
    const parser = new PaimaParser(myGrammar, parserCommands);
    inputs.forEach((i: [string, boolean]) => {
      test(`${i[0]} to be ${i[1]}`, () => {
        try {
          const value = parser.start(i[0]);
          if (value.command === 'join') {
            expect(value.args.base64).toBe(
              'SkdaesAfcUPBaXRQgiGrsJglZucAGdaqV27Fn9VA0ibti/CuFNildZwg/dif4OyWSs8yomAKLCC3TJkTCjogxA=='
            );
          }
          if (value.command === 'joinArray') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const array: string[] = value.args.base64 as any;
            if (array.length === 1) {
              expect(array[0]).toBe(
                'SkdaesAfcUPBaXRQgiGrsJglZucAGdaqV27Fn9VA0ibti/CuFNildZwg/dif4OyWSs8yomAKLCC3TJkTCjogxA=='
              );
            } else if (array.length === 4) {
              expect(array[0]).toBe(
                'SkdaesAfcUPBaXRQgiGrsJglZucAGdaqV27Fn9VA0ibti/CuFNildZwg/dif4OyWSs8yomAKLCC3TJkTCjogxA=='
              );
              expect(array[1]).toBe('x');
              expect(array[2]).toBe(
                '2iu+vn++/jeDG5EB4xTYLlcCLTmGlMFHDY00rseJukNS875Uhz7vtkGx6XZYxgatWk3tiF9+c2BgURiKi/2/+w=='
              );
              expect(array[3]).toBe('f');
            }
          }
          expect(!!value).toBe(i[1]);
        } catch (e) {
          expect(false).toBe(i[1]);
        }
      });
    });
  };

  startTest([
    ['j|', false],
    [
      'j|SkdaesAfcUPBaXRQgiGrsJglZucAGdaqV27Fn9VA0ibti/CuFNildZwg/dif4OyWSs8yomAKLCC3TJkTCjogxA==',
      true,
    ],
    ['a|', true],
    [
      'a|SkdaesAfcUPBaXRQgiGrsJglZucAGdaqV27Fn9VA0ibti/CuFNildZwg/dif4OyWSs8yomAKLCC3TJkTCjogxA==',
      true,
    ],
    [
      'a|SkdaesAfcUPBaXRQgiGrsJglZucAGdaqV27Fn9VA0ibti/CuFNildZwg/dif4OyWSs8yomAKLCC3TJkTCjogxA==,x,2iu+vn++/jeDG5EB4xTYLlcCLTmGlMFHDY00rseJukNS875Uhz7vtkGx6XZYxgatWk3tiF9+c2BgURiKi/2/+w==,f',
      true,
    ],
  ]);
});
