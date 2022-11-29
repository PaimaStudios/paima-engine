import web3 from 'web3-utils';

import {
  ConciseBuilder,
  ConciseBuilderInitializer,
  ConciseValue,
  EncodingVersion,
  InputString,
} from './types.js';
import { isHexString } from './utils.js';
import buildv1 from './v1/builder.js';
import { separator } from './v1/consts.js';
import { toConciseValue } from './v1/utils.js';

const initialize = (input?: InputString, version = EncodingVersion.V1): ConciseBuilder => {
  let initialConciseInput = '';
  let concisePrefix = '';
  let conciseValues: ConciseValue[] = [];

  if (input && version === EncodingVersion.V1) {
    initialConciseInput = isHexString(input) ? web3.hexToUtf8(input) : input;
    const [prefix, ...stringValues] = initialConciseInput.split(separator);
    concisePrefix = prefix;
    conciseValues = stringValues.map(toConciseValue);
  }

  return {
    initialConciseInput,
    concisePrefix,
    conciseValues,
    setPrefix(value: string): void {
      if (!value) {
        throw new Error("Can't use empty value as prefix in concise builder");
      }
      this.concisePrefix = value;
    },
    addValue(value: ConciseValue): void {
      this.conciseValues.push(value);
    },
    addValues(values: ConciseValue[]): void {
      this.conciseValues = this.conciseValues.concat(values);
    },
    insertValue(position: number, value: ConciseValue): void {
      const index = position - 1;
      this.conciseValues.splice(index, 0, value);
    },
    build(): string {
      switch (version) {
        case EncodingVersion.V1:
          return buildv1(this.concisePrefix, this.conciseValues);
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
