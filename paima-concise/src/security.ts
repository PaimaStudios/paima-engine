import { ENV } from '@paima/utils';
import { separator } from './v1/consts';

// For security, we add the .env CONCISE_SECURITY_PREFIX to the string.
export const getSecurityPrefix = (): string => {
  return ENV.CONCISE_SECURITY_PREFIX
    ? `${separator}${ENV.CONCISE_SECURITY_PREFIX}${separator}`
    : '';
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
