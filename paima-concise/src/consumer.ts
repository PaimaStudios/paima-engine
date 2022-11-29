import web3 from 'web3-utils';
import type {
  ConciseConsumer,
  ConciseConsumerInitializer,
  ConciseValue,
} from './types.js';
import { EncodingVersion } from './types.js';
import { isHexString } from './utils.js';
import { separator } from './v1/consts.js';
import { toConciseValue } from './v1/utils.js';

const initialize = (input: string, version = EncodingVersion.V1): ConciseConsumer => {
  let conciseValues: ConciseValue[] = [];
  let concisePrefix = '';
  let conciseInput = '';

  if (version === EncodingVersion.V1) {
    conciseInput = isHexString(input) ? web3.hexToUtf8(input) : input;

    if (!conciseInput.includes(separator)) {
      throw new Error(`Malformed input ${input}`);
    }
    const [inputPrefix, ...stringValues] = conciseInput.split(separator);
    concisePrefix = inputPrefix;
    conciseValues = stringValues.map(toConciseValue);
  }

  return {
    conciseInput,
    concisePrefix,
    conciseValues,
    initialInput(_decompress = false): string {
      return this.conciseInput;
    },
    nextValue(): ConciseValue | '' {
      const [nextValue] = conciseValues.splice(0, 1);
      return nextValue ?? '';
    },
    popValue(): ConciseValue | '' {
      const nextValue = conciseValues.pop();
      return nextValue ?? '';
    },
    prefix(): string {
      return this.concisePrefix;
    },
    readValue(position: number): ConciseValue | '' {
      const index = position - 1;
      return this.conciseValues[index] ?? '';
    },
    stateIdentifiers(): ConciseValue[] {
      return this.conciseValues.filter(value => value.isStateIdentifier);
    },
    valueCount(): number {
      return this.conciseValues.length;
    },
  };
};

/*
 * Selects encoding version based on the format of the input string
 */
const tryInitialize = (input: string): ConciseConsumer => {
  if (input.match(/^[a-z]+\|/)) {
    return initialize(input, EncodingVersion.V1);
  }
  return initialize(input);
};

export const consumer: ConciseConsumerInitializer = { initialize, tryInitialize };
