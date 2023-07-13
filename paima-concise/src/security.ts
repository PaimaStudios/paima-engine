import { ENV } from '@paima/utils';
import { separator } from './v1/consts';

// For security, we add the .env CONCISE_GAME_NAME to the string.
export const getSecurityPrefix = (): string => {
  return ENV.CONCISE_GAME_NAME ? `${separator}${ENV.CONCISE_GAME_NAME}${separator}` : '';
};

export const checkSecurityPrefix = (conciseInput: string): boolean => {
  const securityPrefix = getSecurityPrefix();
  if (securityPrefix) {
    return conciseInput.startsWith(securityPrefix);
  }
  return true;
};

export const stripSecuirtyPrefix = (conciseInput: string): string => {
  const securityPrefix = getSecurityPrefix();
  if (securityPrefix) {
    return conciseInput.slice(securityPrefix.length);
  }
  return conciseInput;
};
