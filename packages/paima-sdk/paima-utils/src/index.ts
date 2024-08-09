import { doLog, setLogger, logError } from './logging.js';
import {
  AddressType,
  DEFAULT_FUNNEL_TIMEOUT,
  ChainDataExtensionType,
  ChainDataExtensionDatumType,
} from './constants.js';
import { GlobalConfig } from './config/singleton.js';
import {
  EvmConfig,
  CardanoConfig,
  MinaConfig,
  ConfigNetworkType,
  OtherEvmConfig,
  MainEvmConfig,
  defaultEvmMainNetworkName,
  defaultCardanoNetworkName,
  defaultMinaNetworkName,
  BaseConfigWithoutDefaults,
  caip2PrefixFor,
  AvailMainConfig,
  AvailConfig,
} from './config/loading.js';
import { ErrorCode, ErrorMessageFxn, ErrorMessageMapping } from './types';

export * from './config.js';
export type * from './types';
export * from './security/parse.js';
export * from './constants.js';
export * from './contracts.js';
export type * from './contracts.js';
export * from './captcha.js';

export {
  AddressType,
  ChainDataExtensionType,
  ChainDataExtensionDatumType,
  DEFAULT_FUNNEL_TIMEOUT,
  logError,
  setLogger,
  doLog,
  GlobalConfig,
  EvmConfig,
  OtherEvmConfig,
  MainEvmConfig,
  CardanoConfig,
  MinaConfig,
  AvailConfig,
  AvailMainConfig,
  ConfigNetworkType,
  defaultEvmMainNetworkName,
  defaultCardanoNetworkName,
  defaultMinaNetworkName,
  BaseConfigWithoutDefaults,
  caip2PrefixFor,
};

export const DEFAULT_GAS_PRICE = '61000000000';

export const SCHEDULED_DATA_ADDRESS = '0x0';
export const SCHEDULED_DATA_ID = 0;

export function buildErrorCodeTranslator(obj: ErrorMessageMapping): ErrorMessageFxn {
  return function (errorCode: ErrorCode): string {
    if (!obj.hasOwnProperty(errorCode)) {
      return 'Unknown error code: ' + errorCode;
    } else {
      return obj[errorCode];
    }
  };
}

// Timeout function for promises
export const timeout = <T>(prom: Promise<T>, time: number): Promise<Awaited<T>> =>
  Promise.race([
    prom,
    new Promise<T>((_resolve, reject) => setTimeout(() => reject('Timeout'), time)),
  ]);

export const wait = async (ms: number): Promise<void> =>
  await new Promise<void>(resolve => {
    setTimeout(() => resolve(), ms);
  });

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retryPromise<T>(
  getPromise: () => Promise<T>,
  waitPeriodMs: number,
  tries: number
): Promise<T> {
  let failure: unknown;

  if (tries <= 0) {
    throw new Error('Too few tries reserved for operation');
  }

  while (tries > 0) {
    try {
      return await getPromise();
    } catch (e) {
      failure = e;
    }

    tries--;

    await wait(waitPeriodMs);
  }

  if (typeof failure === 'undefined') {
    throw new Error('Unknown retry error: no retries left, undefined result');
  } else if (typeof failure === 'string') {
    throw new Error(failure);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal -- we just rethrow whatever was given
    throw failure;
  }
}

function hexStringToBytes(hexString: string): number[] {
  if (!/^[0-9a-fA-F]+$/.test(hexString)) {
    throw new Error('Non-hex digits found in hex string');
  }
  const bytes: number[] = [];
  if (hexString.length % 2 !== 0) {
    hexString = '0' + hexString;
  }
  for (let c = 0; c < hexString.length; c += 2) {
    const nextByte = hexString.slice(c, c + 2);
    bytes.push(parseInt(nextByte, 16));
  }
  return bytes;
}

export function hexStringToUint8Array(hexString: string): Uint8Array {
  return new Uint8Array(hexStringToBytes(hexString));
}

export function uint8ArrayToHexString(uint8Array: Uint8Array): string {
  return Array.prototype.map.call(uint8Array, byte => ('0' + byte.toString(16)).slice(-2)).join('');
}

/**
 * Removes all promises after the first failure in a list
 * Note: if all promises failed, this will just be an empty list (and not an error)
 */
export function cutAfterFirstRejected<T>(results: PromiseSettledResult<T>[]): T[] {
  let firstRejected = results.findIndex(elem => elem.status === 'rejected');
  if (firstRejected < 0) {
    firstRejected = results.length;
  }
  return (
    results
      .slice(0, firstRejected)
      // note: we cast the promise to be a successfully fulfilled promise
      // we know this is safe because the above-line sliced up until the first rejection
      .map(elem => (elem as PromiseFulfilledResult<T>).value)
  );
}

// Only guaranteed to output a sorted array if both input arrays are sorted.
// compare(a, b) should return a positive number if a > b, zero if a = b, negative if a < b.
export function mergeSortedArrays<T>(arr1: T[], arr2: T[], compare: (a: T, b: T) => number): T[] {
  const mergedArray: T[] = [];
  let i1 = 0,
    i2 = 0;

  while (i1 < arr1.length && i2 < arr2.length) {
    if (compare(arr1[i1], arr2[i2]) <= 0) {
      mergedArray.push(arr1[i1++]);
    } else {
      mergedArray.push(arr2[i2++]);
    }
  }

  // One of the arrays is now fully processed, finish processing the other one:
  while (i1 < arr1.length) {
    mergedArray.push(arr1[i1++]);
  }
  while (i2 < arr2.length) {
    mergedArray.push(arr2[i2++]);
  }

  return mergedArray;
}
