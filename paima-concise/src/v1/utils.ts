import { ConciseValue } from '../types.js';
import { stateIdentifier } from './consts.js';

export const toConciseValue = (val: string): ConciseValue => {
  if (val.startsWith(stateIdentifier)) {
    return { value: val.replace(stateIdentifier, ''), isStateIdentifier: true };
  }
  return { value: val, isStateIdentifier: false };
};
