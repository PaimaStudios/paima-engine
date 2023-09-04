import type { ContractAddress, Deployment, URI, VersionString, Web3 } from '@paima/utils';
import { ENV } from '@paima/utils';
import { initWeb3 } from '@paima/utils';

import { PaimaMiddlewareErrorCode, paimaErrorMessageFxn } from './errors';
import type { PostingInfo, PostingModeString } from './types';
import {
  AlgorandConnector,
  CardanoConnector,
  EvmConnector,
  PolkadotConnector,
} from '@paima/providers';

export const enum PostingMode {
  UNBATCHED,
  BATCHED_ETH,
  BATCHED_CARDANO,
  BATCHED_POLKADOT,
  BATCHED_ALGORAND,
  AUTOMATIC,
}

export const POSTING_MODE_NAMES: Record<PostingMode, PostingModeString> = {
  [PostingMode.UNBATCHED]: 'unbatched',
  [PostingMode.BATCHED_ETH]: 'batched-eth',
  [PostingMode.BATCHED_CARDANO]: 'batched-cardano',
  [PostingMode.BATCHED_POLKADOT]: 'batched-polkadot',
  [PostingMode.BATCHED_ALGORAND]: 'batched-algorand',
  [PostingMode.AUTOMATIC]: 'automatic',
};

let gameVersion: VersionString = '0.0.0';
let gameName: string = '';

let backendUri: URI = ENV.BACKEND_URI;
const batcherUri: URI = ENV.BATCHER_URI;

const chainUri: URI = ENV.CHAIN_URI;
const chainExplorerUri: URI = ENV.CHAIN_EXPLORER_URI;
const chainId: number = ENV.CHAIN_ID;
const chainName: string = ENV.CHAIN_NAME;
const chainCurrencyName: string = ENV.CHAIN_CURRENCY_NAME;
const chainCurrencySymbol: string = ENV.CHAIN_CURRENCY_SYMBOL;
const chainCurrencyDecimals: number = ENV.CHAIN_CURRENCY_DECIMALS;

const storageAddress: ContractAddress = ENV.CONTRACT_ADDRESS;

const deployment: Deployment = ENV.DEPLOYMENT as Deployment;

let postingMode: PostingMode = PostingMode.UNBATCHED;

let emulatedBlocksActive: boolean = false;

let web3: Web3 | undefined = undefined;
let fee: string = ENV.DEFAULT_FEE;

export const setBackendUri = (newUri: URI): URI => (backendUri = newUri);
export const getBackendUri = (): URI => backendUri;
export const getBatcherUri = (): URI => batcherUri;

export const setEmulatedBlocksActive = (): void => {
  emulatedBlocksActive = true;
};
export const setEmulatedBlocksInactive = (): void => {
  emulatedBlocksActive = false;
};
export const getEmulatedBlocksActive = (): boolean => emulatedBlocksActive;

export const setGameVersion = (newGameVersion: VersionString): VersionString =>
  (gameVersion = newGameVersion);
export const getGameVersion = (): VersionString => gameVersion;
export const setGameName = (newGameName: string): string => (gameName = newGameName);
export const getGameName = (): string => gameName;

export const getChainUri = (): URI => chainUri;
export const getChainExplorerUri = (): URI => chainExplorerUri;
export const getChainId = (): number => chainId;
export const getChainName = (): string => chainName;
export const getChainCurrencyName = (): string => chainCurrencyName;
export const getChainCurrencySymbol = (): string => chainCurrencySymbol;
export const getChainCurrencyDecimals = (): number => chainCurrencyDecimals;

export const getStorageAddress = (): ContractAddress => storageAddress;

export const getDeployment = (): Deployment => deployment;

export const getPostingMode = (): PostingMode => postingMode;
export const getPostingModeString = (): PostingModeString => POSTING_MODE_NAMES[postingMode];
const setPostingMode = (newMode: PostingMode): PostingMode => (postingMode = newMode);
export const setUnbatchedMode = (): PostingMode => setPostingMode(PostingMode.UNBATCHED);
export const setBatchedEthMode = (): PostingMode => setPostingMode(PostingMode.BATCHED_ETH);
export const setBatchedCardanoMode = (): PostingMode => setPostingMode(PostingMode.BATCHED_CARDANO);
export const setBatchedPolkadotMode = (): PostingMode =>
  setPostingMode(PostingMode.BATCHED_POLKADOT);
export const setBatchedAlgorandMode = (): PostingMode =>
  setPostingMode(PostingMode.BATCHED_ALGORAND);
export const setAutomaticMode = (): PostingMode => setPostingMode(PostingMode.AUTOMATIC);

export const setFee = (newFee: string): string => (fee = newFee);
export const getFee = (): string => fee;

export const getWeb3 = async (): Promise<Web3> => {
  if (typeof web3 === 'undefined') {
    web3 = await initWeb3(chainUri);
  }
  return web3;
};

export const getActiveAddress = (): string => {
  switch (postingMode) {
    case PostingMode.UNBATCHED:
    case PostingMode.BATCHED_ETH:
      return EvmConnector.instance().getOrThrowProvider().getAddress();
    case PostingMode.BATCHED_CARDANO:
      return CardanoConnector.instance().getOrThrowProvider().getAddress();
    case PostingMode.BATCHED_POLKADOT:
      return PolkadotConnector.instance().getOrThrowProvider().getAddress();
    case PostingMode.AUTOMATIC:
      return EvmConnector.instance().getOrThrowProvider().getAddress();
    case PostingMode.BATCHED_ALGORAND:
      return AlgorandConnector.instance().getOrThrowProvider().getAddress();
    default:
      const errorCode = PaimaMiddlewareErrorCode.INTERNAL_INVALID_POSTING_MODE;
      const errorMessage = `${paimaErrorMessageFxn(errorCode)}: ${postingMode}`;
      throw new Error(errorMessage);
  }
};

export const getPostingInfo = (): PostingInfo => ({
  address: getActiveAddress(),
  postingModeString: getPostingModeString(),
});
