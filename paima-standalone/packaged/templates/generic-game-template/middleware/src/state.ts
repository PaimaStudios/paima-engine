import type { ContractAddress, EthAddress, URI } from '@game/utils';
import {
  BACKEND_URI,
  BATCHER_URI,
  CHAIN_CURRENCY_DECIMALS,
  CHAIN_CURRENCY_NAME,
  CHAIN_CURRENCY_SYMBOL,
  CHAIN_EXPLORER_URI,
  CHAIN_ID,
  CHAIN_NAME,
  CHAIN_URI,
  DEFAULT_FEE,
  INDEXER_URI,
  STATEFUL_URI,
  STORAGE_ADDRESS,
} from '@game/utils';
import type { ETHAddress, Web3 } from 'paima-sdk/paima-utils';
import { initWeb3 } from 'paima-sdk/paima-utils';

let backendUri: URI = BACKEND_URI;
const indexerUri: URI = INDEXER_URI;
const batcherUri: URI = BATCHER_URI;
const statefulUri: URI = STATEFUL_URI;

const chainUri: URI = CHAIN_URI;
const chainExplorerUri: URI = CHAIN_EXPLORER_URI;
const chainId: number = CHAIN_ID;
const chainName: string = CHAIN_NAME;
const chainCurrencyName: string = CHAIN_CURRENCY_NAME;
const chainCurrencySymbol: string = CHAIN_CURRENCY_SYMBOL;
const chainCurrencyDecimals: number = CHAIN_CURRENCY_DECIMALS;

const storageAddress: ContractAddress = STORAGE_ADDRESS;

let ethAddress: EthAddress = '';

let web3: Web3 | undefined = undefined;
let fee: string = DEFAULT_FEE;

export const setBackendUri = (newUri: URI) => (backendUri = newUri);
export const getBackendUri = (): URI => backendUri;
export const getIndexerUri = (): URI => indexerUri;
export const getBatcherUri = (): URI => batcherUri;
export const getStatefulUri = (): URI => statefulUri;

export const getChainUri = (): URI => chainUri;
export const getChainExplorerUri = (): URI => chainExplorerUri;
export const getChainId = (): number => chainId;
export const getChainName = (): string => chainName;
export const getChainCurrencyName = (): string => chainCurrencyName;
export const getChainCurrencySymbol = (): string => chainCurrencySymbol;
export const getChainCurrencyDecimals = (): number => chainCurrencyDecimals;

export const getStorageAddress = (): ContractAddress => storageAddress;

export const setEthAddress = (addr: ETHAddress) => (ethAddress = addr);
export const getEthAddress = (): ETHAddress => ethAddress;
export const ethConnected = (): boolean => ethAddress !== '';

export const setFee = (newFee: string) => (fee = newFee);
export const getFee = (): string => fee;

export const getWeb3 = async (): Promise<Web3> => {
  if (typeof web3 === 'undefined') {
    web3 = await initWeb3(chainUri);
  }
  return web3;
};
