import type { ConciseValue, UTF8String } from '../types.js';
import { separator, stateIdentifier } from './consts.js';
import { getSecurityPrefix } from '../security.js';

const toString = (val: ConciseValue): string => {
  return val.isStateIdentifier ? `${stateIdentifier}${val.value}` : val.value;
};

const build = (
  concisePrefix: string,
  gameName: undefined | string,
  conciseValues: ConciseValue[]
): UTF8String => {
  if (!concisePrefix) {
    throw new Error(`Missing prefix value in concise builder for input: ${conciseValues}`);
  }
  const securityPrefix = getSecurityPrefix(gameName);
  const conciseValueInput = conciseValues.map(toString).join(separator);
  const conciseInput = `${securityPrefix}${concisePrefix}${separator}${conciseValueInput}`;

  return conciseInput;
};

export default build;
