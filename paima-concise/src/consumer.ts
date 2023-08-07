import web3 from 'web3-utils';
import type {
  ConciseConsumerInitializer,
  ConciseConsumerInternals,
  ConciseValue,
} from './types.js';
import { EncodingVersion } from './types.js';
import { isHexString } from './utils.js';
import { separator } from './v1/consts.js';
import { toConciseValue } from './v1/utils.js';

const initializeSpecific: ConciseConsumerInitializer['initializeSpecific'] = (input, version) => {
  const { conciseValues, concisePrefix, conciseInput } = preParse(input, version);

  return {
    conciseInput,
    concisePrefix,
    conciseValues,
    initialInput(_decompress = false): string {
      return this.conciseInput;
    },
    nextValue(): ConciseValue | null {
      const [nextValue] = conciseValues.splice(0, 1);
      return nextValue ?? null;
    },
    remainingValues(): ConciseValue[] {
      return this.conciseValues;
    },
    popValue(): ConciseValue | null {
      const nextValue = conciseValues.pop();
      return nextValue ?? null;
    },
    prefix(): string {
      return this.concisePrefix;
    },
    readValue(position: number): ConciseValue | null {
      const index = position - 1;
      return this.conciseValues[index] ?? null;
    },
    stateIdentifiers(): ConciseValue[] {
      return this.conciseValues.filter(value => value.isStateIdentifier);
    },
    valueCount(): number {
      return this.conciseValues.length;
    },
  };
};

const preParse = (input: string, version: EncodingVersion): ConciseConsumerInternals => {
  let conciseValues: ConciseValue[] = [];
  let concisePrefix = '';
  let conciseInput = '';
  let conciseImplicitUser = false;

  if (version === EncodingVersion.EMPTY) {
    return getEmptyInternals();
  } else if (version === EncodingVersion.V1) {
    conciseInput = isHexString(input) ? web3.hexToUtf8(input) : input;

    if (!conciseInput.includes(separator)) {
      return getEmptyInternals();
    }

    const [inputPrefix, ...stringValues] = conciseInput.split(separator);
    const hasImplicitUser = inputPrefix.match(/^@(\w+)/);
    if (hasImplicitUser) {
      conciseImplicitUser = true;
      concisePrefix = hasImplicitUser[1];
    } else {
      concisePrefix = inputPrefix;
    }
    conciseValues = stringValues.map(toConciseValue);
  }

  return {
    conciseImplicitUser,
    conciseValues,
    concisePrefix,
    conciseInput,
  };
};

const getEmptyInternals = (): ConciseConsumerInternals => {
  return {
    conciseImplicitUser: false,
    conciseValues: [],
    concisePrefix: '',
    conciseInput: '',
  };
};

/*
 * Selects encoding version based on the format of the input string
 */
const initialize: ConciseConsumerInitializer['initialize'] = (input, options) => {
  if (options?.version) {
    return initializeSpecific(input, options?.version);
  } else if (input.match(/^[a-z]+\|/)) {
    return initializeSpecific(input, EncodingVersion.V1);
  }
  return initializeSpecific(input, EncodingVersion.EMPTY);
};

export const consumer: ConciseConsumerInitializer = { initialize, initializeSpecific };
