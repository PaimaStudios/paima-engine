import web3 from 'web3-utils';

import type {
  ConciseBuilder,
  ConciseBuilderInitializer,
  ConciseValue,
  InputString,
} from './types.js';
import { EncodingVersion } from './types.js';
import { isHexString } from './utils.js';
import buildv1 from './v1/builder.js';
import { separator, FORBIDDEN_CHARACTERS } from './v1/consts.js';
import { toConciseValue } from './v1/utils.js';

function validateString(s: string): boolean {
  for (const c of FORBIDDEN_CHARACTERS) {
    if (s.includes(c)) {
      return false;
    }
  }
  return true;
}

const initialize = (
  input?: InputString,
  gameName?: string,
  version = EncodingVersion.V1
): ConciseBuilder => {
  let initialConciseInput = '';
  let concisePrefix = '';
  let conciseValues: ConciseValue[] = [];

  if (input && version === EncodingVersion.V1) {
    initialConciseInput = isHexString(input) ? web3.hexToUtf8(input) : input;
    const [prefix, ...stringValues] = initialConciseInput.split(separator);

    for (const s of [prefix, ...stringValues]) {
      if (!validateString(s)) {
        throw new Error('Cannot use forbidden symbols in concise builder');
      }
    }

    concisePrefix = prefix;
    conciseValues = stringValues.map(toConciseValue);
  }

  return {
    initialConciseInput,
    concisePrefix,
    conciseValues,
    gameName,
    setPrefix(value: string, implicitUserAddress = false): void {
      if (!value) {
        throw new Error("Can't use empty value as prefix in concise builder");
      }
      this.concisePrefix = (implicitUserAddress ? '@' : '') + value;
    },
    addValue(value: ConciseValue): void {
      if (!validateString(value.value)) {
        throw new Error('Cannot use forbidden symbols in concise builder');
      }
      this.conciseValues.push(value);
    },
    addValues(values: ConciseValue[]): void {
      for (const value of values) {
        if (!validateString(value.value)) {
          throw new Error('Cannot use forbidden symbols in concise builder');
        }
      }
      this.conciseValues = this.conciseValues.concat(values);
    },
    insertValue(position: number, value: ConciseValue): void {
      if (!validateString(value.value)) {
        throw new Error('Cannot use forbidden symbols in concise builder');
      }
      const index = position - 1;
      this.conciseValues.splice(index, 0, value);
    },
    build(): string {
      switch (version) {
        case EncodingVersion.V1:
          return buildv1(this.concisePrefix, this.gameName, this.conciseValues);
        default:
          throw Error(`Concise builder initialized with unsupported encoding version: ${version}`);
      }
    },
    initialInput(): string {
      return this.initialConciseInput;
    },
    valueCount(): number {
      return this.conciseValues.length;
    },
  };
};

export const builder: ConciseBuilderInitializer = { initialize };
