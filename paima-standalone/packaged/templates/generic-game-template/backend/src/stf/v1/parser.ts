import P from 'parsimmon';
import type { ConciseValue } from 'paima-sdk/paima-concise';
import { consumer } from 'paima-sdk/paima-concise';

import type { InvalidInput } from '@game/utils';
import type { GainExperienceInput, InputTypes } from '../../types';

/**
 * Helper function to transform list of string values into an object based on provided parsers.
 * Each value is parsed with the parser on the same position and appended to the resulting object.
 */
const parseValues = (parsers: [string, P.Parser<any>][], values: ConciseValue[]) => {
  if (parsers.length != values.length) {
    throw new Error(
      `Count inequality between parsers ${parsers.length} and values ${values.length}`
    );
  }

  return values.reduce((acc, { value }, i) => {
    const [key, parser] = parsers[i];
    return { ...acc, [key]: parser.tryParse(value) };
  }, {});
};

const base62 = P.alt(P.letter, P.digit);
const wallet = base62.many().tie();

const xpValue = P.digits.map(Number).chain(n => {
  if (n >= 1 && n <= 5) return P.succeed(n);
  else return P.fail(`XP gain must be between 1 and 5`);
});

// Possible inputs:
const prefixParsers: P.Parser<InputTypes>[] = [P.string('xp')];
const prefixParser = P.alt(...prefixParsers);

// Input parsers:
const gainedExperience = (values: ConciseValue[]) => {
  type GainExperienceParsers = [keyof GainExperienceInput, P.Parser<any>][];
  const parsers: GainExperienceParsers = [
    ['address', wallet],
    ['experience', xpValue],
  ];
  return {
    input: 'gainedExperience',
    ...parseValues(parsers, values),
  } as GainExperienceInput;
};

type ParsedSubmittedInput = GainExperienceInput | InvalidInput;
export function isInvalid(input: ParsedSubmittedInput): input is InvalidInput {
  return (input as InvalidInput).input == 'invalidString';
}

function parse(s: string): ParsedSubmittedInput {
  try {
    const { concisePrefix, conciseValues } = consumer.initialize(s);
    const inputType = prefixParser.tryParse(concisePrefix);
    switch (inputType) {
      case 'xp':
        return gainedExperience(conciseValues);
      default:
        return { input: 'invalidString' };
    }
  } catch (e) {
    console.log(e, 'parsing failure');
    return { input: 'invalidString' };
  }
}

export default parse;
