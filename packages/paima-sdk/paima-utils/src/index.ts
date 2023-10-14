import Web3 from 'web3';
import type { AbiItem } from 'web3-utils';
import type { Contract, EventData } from 'web3-eth-contract';
import web3UtilsPkg from 'web3-utils';
import paimaL2ContractBuild from './artifacts/PaimaL2Contract';
import erc20ContractBuild from './artifacts/ERC20Contract';
import erc721ContractBuild from './artifacts/ERC721Contract';
import paimaErc721ContractBuild from './artifacts/PaimaERC721Contract';
import erc165ContractBuild from './artifacts/ERC165Contract';
import erc6551RegistryContractBuild from './artifacts/ERC6551RegistryContract';
import type * as Contracts from './contract-types';
import { doLog, logError } from './logging.js';
import type { Deployment, ErrorCode, ErrorMessageFxn, ErrorMessageMapping } from './types';
import {
  AddressType,
  DEFAULT_FUNNEL_TIMEOUT,
  ChainDataExtensionType,
  ChainDataExtensionDatumType,
} from './constants';

const { isAddress } = web3UtilsPkg;

export * from './config';
export * from './types';
export type * from './types';
export * from './security/parse';
export type * from './contract-types';

export type { Web3, Contract, AbiItem, EventData };
export {
  AddressType,
  ChainDataExtensionType,
  ChainDataExtensionDatumType,
  DEFAULT_FUNNEL_TIMEOUT,
  logError,
  doLog,
};

export const DEFAULT_GAS_PRICE = '61000000000' as const;

export const SCHEDULED_DATA_ADDRESS = '0x0';

export function buildErrorCodeTranslator(obj: ErrorMessageMapping): ErrorMessageFxn {
  return function (errorCode: ErrorCode): string {
    if (!obj.hasOwnProperty(errorCode)) {
      return 'Unknown error code: ' + errorCode;
    } else {
      return obj[errorCode];
    }
  };
}

/**
 * @deprecated use ENV.BLOCK_TIME instead
 */
export function getBlockTime(deployment: Deployment): number {
  if (deployment === 'C1') return 4;
  else if (deployment === 'A1') return 4.5;
  else throw new Error(`[getBlockTime] unsupported deployment: ${deployment}`);
}

export async function initWeb3(nodeUrl: string): Promise<Web3> {
  const web3 = new Web3(nodeUrl);
  try {
    await web3.eth.getNodeInfo();
  } catch (e) {
    throw new Error(`Error connecting to node at ${nodeUrl}:\n${e}`);
  }
  return web3;
}

export function getAbiContract(address: string, abi: AbiItem[], web3?: Web3): Contract {
  if (web3 === undefined) {
    web3 = new Web3();
  }
  return new web3.eth.Contract(abi, address);
}

export function getPaimaL2Contract(address: string, web3?: Web3): Contracts.PaimaL2Contract {
  return getAbiContract(
    address,
    paimaL2ContractBuild.abi as AbiItem[],
    web3
  ) as unknown as Contracts.PaimaL2Contract;
}

export function getErc20Contract(address: string, web3?: Web3): Contracts.ERC20Contract {
  return getAbiContract(
    address,
    erc20ContractBuild.abi as AbiItem[],
    web3
  ) as unknown as Contracts.ERC20Contract;
}

export function getErc721Contract(address: string, web3?: Web3): Contracts.ERC721Contract {
  return getAbiContract(
    address,
    erc721ContractBuild.abi as AbiItem[],
    web3
  ) as unknown as Contracts.ERC721Contract;
}

export function getPaimaErc721Contract(
  address: string,
  web3?: Web3
): Contracts.PaimaERC721Contract {
  return getAbiContract(
    address,
    paimaErc721ContractBuild.abi as AbiItem[],
    web3
  ) as unknown as Contracts.PaimaERC721Contract;
}

export function getErc165Contract(address: string, web3?: Web3): Contracts.ERC165Contract {
  return getAbiContract(
    address,
    erc165ContractBuild.abi as AbiItem[],
    web3
  ) as unknown as Contracts.ERC165Contract;
}

export function getErc6551RegistryContract(
  address: string,
  web3?: Web3
): Contracts.ERC6551RegistryContract {
  return getAbiContract(
    address,
    erc6551RegistryContractBuild.abi as AbiItem[],
    web3
  ) as unknown as Contracts.ERC6551RegistryContract;
}

export function validatePaimaL2ContractAddress(address: string): void {
  if (!isAddress(address)) {
    throw new Error(`Invalid storage address supplied. Found: ${address}`);
  }
}

export async function retrieveFee(address: string, web3: Web3): Promise<string> {
  const contract = getPaimaL2Contract(address, web3);
  return await contract.methods.fee().call();
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

export async function getPaimaL2ContractOwner(address: string, web3: Web3): Promise<string> {
  const contract = getPaimaL2Contract(address, web3);
  return await contract.methods.owner().call();
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
