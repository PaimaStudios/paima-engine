import type { ConciseValue } from '../types';
import { stateIdentifier } from './consts';

export const toConciseValue = (val: string): ConciseValue => {
  if (val.startsWith(stateIdentifier)) {
    return { value: val.replace(stateIdentifier, ''), isStateIdentifier: true };
  }
  return { value: val, isStateIdentifier: false };
};
