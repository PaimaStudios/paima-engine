import Web3 from 'web3';
import type { AbiItem } from 'web3-utils';
import pkg from 'web3-utils';
import storageBuild from './artifacts/Storage.js';
import type { Storage as StorageContract } from './contract-types/Storage';
import { doLog, logError } from './logging.js';
import type {
  ChainData,
  ChainDataExtension,
  ChainFunnel,
  ErrorCode,
  ErrorMessageFxn,
  ErrorMessageMapping,
  TsoaFunction,
  ETHAddress,
  GameStateMachine,
  GameStateMachineInitializer,
  GameStateTransitionFunction,
  GameStateTransitionFunctionRouter,
  PaimaRuntime,
  PaimaRuntimeInitializer,
  SQLUpdate,
  SubmittedChainData,
  TransactionTemplate,
} from './types';
import { tx } from './pg-tx';
const { isAddress } = pkg;

export type { Web3 };
export type { StorageContract };
export {
  ChainFunnel,
  TsoaFunction,
  ETHAddress,
  SQLUpdate,
  ErrorCode,
  ErrorMessageFxn,
  ErrorMessageMapping,
  SubmittedChainData,
  ChainData,
  GameStateTransitionFunctionRouter,
  GameStateTransitionFunction,
  GameStateMachineInitializer,
  GameStateMachine,
  PaimaRuntimeInitializer,
  PaimaRuntime,
  ChainDataExtension,
  TransactionTemplate,
  logError,
  doLog,
  tx,
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

export async function initWeb3(nodeUrl: string): Promise<Web3> {
  const web3 = new Web3(nodeUrl);
  try {
    await web3.eth.getNodeInfo();
  } catch (e) {
    throw new Error(`Error connecting to node at ${nodeUrl}:\n${e}`);
  }
  return web3;
}

export function getStorageContract(address?: string, web3?: Web3): StorageContract {
  if (web3 === undefined) {
    web3 = new Web3();
  }
  return new web3.eth.Contract(
    storageBuild.abi as AbiItem[],
    address
  ) as unknown as StorageContract;
}

export function validateStorageAddress(address: string): void {
  if (!isAddress(address)) {
    throw new Error('Invalid storage address supplied');
  }
}

export async function retrieveFee(address: string, web3: Web3): Promise<string> {
  const contract = getStorageContract(address, web3);
  return await contract.methods.fee().call();
}

export const wait = async (ms: number): Promise<void> =>
  await new Promise<void>(resolve => {
    setTimeout(() => resolve(), ms);
  });

export async function getOwner(address: string, web3: Web3): Promise<string> {
  const contract = getStorageContract(address, web3);
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
