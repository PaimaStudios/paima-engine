import type { URI, VersionString, Web3 } from '@paima/utils';
import type { ContractAddress } from '@paima/chain-types';
import { ENV, GlobalConfig } from '@paima/utils';
import { initWeb3 } from '@paima/utils';

import { PaimaMiddlewareErrorCode, paimaErrorMessageFxn } from './errors.js';
import type { IProvider, WalletMode } from '@paima/providers';
import { callProvider } from '@paima/providers';

export const enum PostingMode {
  UNBATCHED,
  BATCHED,
}

let gameVersion: VersionString = '0.0.0';
let gameName: string = '';

let backendUri: URI = ENV.BACKEND_URI;
const batcherUri: URI = ENV.BATCHER_URI;

const storageAddress: ContractAddress = ENV.CONTRACT_ADDRESS;

let emulatedBlocksActive: undefined | boolean = undefined;

let web3: Web3 | undefined = undefined;

type FeeCache = {
  fee: string;
  lastFetch: number;
};
let fee: undefined | FeeCache = undefined;

export const setBackendUri = (newUri: URI): URI => (backendUri = newUri);
export const getBackendUri = (): URI => backendUri;
export const getBatcherUri = (): URI => batcherUri;

export const setEmulatedBlocksActive = (): void => {
  emulatedBlocksActive = true;
};
export const setEmulatedBlocksInactive = (): void => {
  emulatedBlocksActive = false;
};
export const getEmulatedBlocksActive = (): undefined | boolean => emulatedBlocksActive;

export const setGameVersion = (newGameVersion: VersionString): VersionString =>
  (gameVersion = newGameVersion);
export const getGameVersion = (): VersionString => gameVersion;
export const setGameName = (newGameName: string): string => (gameName = newGameName);
export const getGameName = (): string => gameName;

export const getStorageAddress = (): ContractAddress => storageAddress;

let defaultProvider: IProvider<unknown> | undefined;
export const getDefaultProvider = (): IProvider<unknown> | undefined => defaultProvider;
export const setDefaultProvider = <T>(provider: IProvider<T>): IProvider<T> =>
  (defaultProvider = provider);

let postingMode: Map<IProvider<unknown>, PostingMode> = new Map();
export const getPostingMode = (provider: IProvider<unknown>): PostingMode | undefined =>
  postingMode.get(provider);
export const setPostingMode = (provider: IProvider<unknown>, newMode: PostingMode): PostingMode => {
  postingMode.set(provider, newMode);
  return newMode;
};

let loginMap: Map<WalletMode, boolean> = new Map();
export const hasLogin = (mode: WalletMode): boolean => loginMap.has(mode);
export const addLogin = (mode: WalletMode): void => {
  loginMap.set(mode, true);
};

export const setFee = (newFee: string): FeeCache =>
  (fee = {
    lastFetch: new Date().getTime(),
    fee: newFee,
  });
export const getFee = (): undefined | FeeCache => fee;

export const getWeb3 = async (): Promise<Web3> => {
  if (typeof web3 === 'undefined') {
    const evmConfig = await GlobalConfig.mainEvmConfig();
    if (evmConfig == null) {
      throw new Error(`getWeb3 called, but no EVM configuration was set`);
    }
    const [_, config] = evmConfig;
    web3 = await initWeb3(config.chainUri);
  }
  return web3;
};

export const getDefaultActiveAddress = (): string => {
  if (defaultProvider == null) {
    const errorCode = PaimaMiddlewareErrorCode.WALLET_NOT_CONNECTED;
    throw new Error(paimaErrorMessageFxn(errorCode));
  }
  return defaultProvider.getAddress().address;
};
export const getActiveAddress = (mode: WalletMode): string => {
  return callProvider(mode, 'getAddress').address;
};
