import { separator } from './v1/consts';

// For security, we add the game name to the string.
export const getSecurityPrefix = (gameName: undefined | string): string => {
  return gameName ? `${separator}${gameName}${separator}` : '';
};

export const checkSecurityPrefix = (
  gameName: undefined | string,
  conciseInput: string
): boolean => {
  const securityPrefix = getSecurityPrefix(gameName);
  if (securityPrefix) {
    return conciseInput.startsWith(securityPrefix);
  }
  return true;
};

export const stripSecurityPrefix = (gameName: undefined | string, conciseInput: string): string => {
  const securityPrefix = getSecurityPrefix(gameName);
  if (securityPrefix) {
    if (conciseInput.startsWith(securityPrefix)) {
      return conciseInput.slice(securityPrefix.length);
    } else {
      return conciseInput;
    }
  }
  return conciseInput;
};
