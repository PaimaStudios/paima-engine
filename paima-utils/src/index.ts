import type { Transaction, SuggestedParams } from 'algosdk';
import { makePaymentTxnWithSuggestedParams } from 'algosdk';
import Web3 from 'web3';
import type { AbiItem } from 'web3-utils';
import web3UtilsPkg from 'web3-utils';
import paimaL2ContractBuild from './artifacts/PaimaL2Contract';
import erc20ContractBuild from './artifacts/ERC20Contract';
import erc721ContractBuild from './artifacts/ERC721Contract';
import paimaErc721ContractBuild from './artifacts/PaimaERC721Contract';
import erc165ContractBuild from './artifacts/ERC165Contract';
import type { PaimaL2Contract } from './contract-types/PaimaL2Contract';
import type { ERC20Contract } from './contract-types/ERC20Contract';
import type { ERC721Contract } from './contract-types/ERC721Contract';
import type { PaimaERC721Contract } from './contract-types/PaimaERC721Contract';
import type { ERC165Contract } from './contract-types/ERC165Contract';
import { doLog, logError } from './logging.js';
import type {
  Deployment,
  ErrorCode,
  ErrorMessageFxn,
  ErrorMessageMapping,
  ETHAddress,
  TransactionTemplate,
  InputDataString,
} from './types';
import {
  AddressType,
  INNER_BATCH_DIVIDER,
  OUTER_BATCH_DIVIDER,
  DEFAULT_FUNNEL_TIMEOUT,
  ChainDataExtensionType,
  ChainDataExtensionDatumType,
} from './constants';

const { isAddress, utf8ToHex } = web3UtilsPkg;

export * from './config';
export * from './types';

export type { Web3 };
export type { PaimaL2Contract };
export type { ERC20Contract, ERC721Contract, PaimaERC721Contract, ERC165Contract };
export {
  ETHAddress,
  ErrorCode,
  ErrorMessageFxn,
  ErrorMessageMapping,
  TransactionTemplate,
  AddressType,
  ChainDataExtensionType,
  ChainDataExtensionDatumType,
  InputDataString,
  INNER_BATCH_DIVIDER,
  OUTER_BATCH_DIVIDER,
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

export function getPaimaL2Contract(address?: string, web3?: Web3): PaimaL2Contract {
  if (web3 === undefined) {
    web3 = new Web3();
  }
  return new web3.eth.Contract(
    paimaL2ContractBuild.abi as AbiItem[],
    address
  ) as unknown as PaimaL2Contract;
}

export function getErc20Contract(address?: string, web3?: Web3): ERC20Contract {
  if (web3 === undefined) {
    web3 = new Web3();
  }
  return new web3.eth.Contract(
    erc20ContractBuild.abi as AbiItem[],
    address
  ) as unknown as ERC20Contract;
}

export function getErc721Contract(address?: string, web3?: Web3): ERC721Contract {
  if (web3 === undefined) {
    web3 = new Web3();
  }
  return new web3.eth.Contract(
    erc721ContractBuild.abi as AbiItem[],
    address
  ) as unknown as ERC721Contract;
}

export function getPaimaErc721Contract(address?: string, web3?: Web3): PaimaERC721Contract {
  if (web3 === undefined) {
    web3 = new Web3();
  }
  return new web3.eth.Contract(
    paimaErc721ContractBuild.abi as AbiItem[],
    address
  ) as unknown as PaimaERC721Contract;
}

export function getErc165Contract(address?: string, web3?: Web3): ERC165Contract {
  if (web3 === undefined) {
    web3 = new Web3();
  }
  return new web3.eth.Contract(
    erc165ContractBuild.abi as AbiItem[],
    address
  ) as unknown as ERC165Contract;
}

export function validatePaimaL2ContractAddress(address: string): void {
  if (!isAddress(address)) {
    throw new Error('Invalid storage address supplied');
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
    throw failure;
  }
}

function hexStringToBytes(hexString: string): number[] {
  if (!/^[0-9a-fA-F]+$/.test(hexString)) {
      throw new Error("Non-hex digits found in hex string");
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

export function buildAlgorandTransaction(userAddress: string, message: string): Transaction {
  const hexMessage = utf8ToHex(message).slice(2);
  const msgArray = hexStringToUint8Array(hexMessage);
  const SUGGESTED_PARAMS: SuggestedParams = {
    fee: 0,
    firstRound: 10,
    lastRound: 10,
    genesisID: 'mainnet-v1.0',
    genesisHash: 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=',
  };
  return makePaymentTxnWithSuggestedParams(
    userAddress,
    userAddress,
    0,
    userAddress,
    msgArray,
    SUGGESTED_PARAMS
  );
}
