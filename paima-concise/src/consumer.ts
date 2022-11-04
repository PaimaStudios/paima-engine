import web3 from 'web3-utils';

import {
  ConciseConsumer,
  ConciseConsumerInitializer,
  ConciseValue,
  EncodingVersion,
} from './types';
import { isHexString } from './utils';
import { separator } from './v1/consts';
import { toConciseValue } from './v1/utils';

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
    initialInput(decompress = false) {
      return this.conciseInput;
    },
    nextValue() {
      const [nextValue] = conciseValues.splice(0, 1);
      return nextValue ?? '';
    },
    popValue() {
      const nextValue = conciseValues.pop();
      return nextValue ?? '';
    },
    prefix() {
      return this.concisePrefix;
    },
    readValue(position: number) {
      const index = position - 1;
      return this.conciseValues[index] ?? '';
    },
    stateIdentifiers() {
      return this.conciseValues.filter((value) => value.isStateIdentifier);
    },
    valueCount() {
      return this.conciseValues.length;
    },
  };
};

export const consumer: ConciseConsumerInitializer = { initialize };
