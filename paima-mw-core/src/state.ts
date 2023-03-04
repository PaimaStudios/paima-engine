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
  DEPLOYMENT,
  STORAGE_ADDRESS,
} from '@paima/utils';
import type {
  CardanoAddress,
  ContractAddress,
  Deployment,
  ETHAddress,
  PolkadotAddress,
  URI,
  VersionString,
  Web3,
} from '@paima/utils';
import { initWeb3 } from '@paima/utils';
import { PaimaMiddlewareErrorCode, paimaErrorMessageFxn } from './errors';
import type { CardanoApi, PolkadotSignFxn, PostingInfo, PostingModeString } from './types';
import type { HDWalletProvider } from './wallets/truffle';

export const enum PostingMode {
  UNBATCHED,
  BATCHED_ETH,
  BATCHED_CARDANO,
  BATCHED_POLKADOT,
  AUTOMATIC,
}

export const POSTING_MODE_NAMES: Record<PostingMode, PostingModeString> = {
  [PostingMode.UNBATCHED]: 'unbatched',
  [PostingMode.BATCHED_ETH]: 'batched-eth',
  [PostingMode.BATCHED_CARDANO]: 'batched-cardano',
  [PostingMode.BATCHED_POLKADOT]: 'batched-polkadot',
  [PostingMode.AUTOMATIC]: 'automatic',
};

let gameVersion: VersionString = '0.0.0';
let gameName: string = '';

let backendUri: URI = BACKEND_URI;
const batcherUri: URI = BATCHER_URI;

const chainUri: URI = CHAIN_URI;
const chainExplorerUri: URI = CHAIN_EXPLORER_URI;
const chainId: number = CHAIN_ID;
const chainName: string = CHAIN_NAME;
const chainCurrencyName: string = CHAIN_CURRENCY_NAME;
const chainCurrencySymbol: string = CHAIN_CURRENCY_SYMBOL;
const chainCurrencyDecimals: number = CHAIN_CURRENCY_DECIMALS;

const storageAddress: ContractAddress = STORAGE_ADDRESS;

const deployment: Deployment = DEPLOYMENT as Deployment;

let postingMode: PostingMode = PostingMode.UNBATCHED;

let ethAddress: ETHAddress = '';
let truffleAddress: ETHAddress = '';
let truffleProvider: HDWalletProvider | undefined = undefined;
let truffleWeb3: Web3 | undefined = undefined;

let web3: Web3 | undefined = undefined;
let fee: string = DEFAULT_FEE;

let cardanoAddress: CardanoAddress = '';
let cardanoHexAddress: CardanoAddress = '';
let cardanoApi: CardanoApi = undefined;
let cardanoActiveWallet: string = '';

let polkadotAddress: PolkadotAddress = '';
let polkadotSignFxn: PolkadotSignFxn = undefined;

export const setBackendUri = (newUri: URI): URI => (backendUri = newUri);
export const getBackendUri = (): URI => backendUri;
export const getBatcherUri = (): URI => batcherUri;

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
export const setAutomaticMode = (): PostingMode => setPostingMode(PostingMode.AUTOMATIC);

export const setEthAddress = (addr: ETHAddress): ETHAddress => (ethAddress = addr);
export const getEthAddress = (): ETHAddress => ethAddress;
export const ethConnected = (): boolean => ethAddress !== '';

export const setCardanoAddress = (addr: CardanoAddress): CardanoAddress => (cardanoAddress = addr);
export const getCardanoAddress = (): CardanoAddress => cardanoAddress;
export const setCardanoHexAddress = (addr: CardanoAddress): CardanoAddress =>
  (cardanoHexAddress = addr);
export const getCardanoHexAddress = (): CardanoAddress => cardanoHexAddress;
export const cardanoConnected = (): boolean => cardanoActiveWallet !== '';

export const setCardanoApi = (api: CardanoApi): CardanoApi => (cardanoApi = api);
export const getCardanoApi = (): CardanoApi => cardanoApi;

export const setCardanoActiveWallet = (newWallet: string): string =>
  (cardanoActiveWallet = newWallet);
export const getCardanoActiveWallet = (): string => cardanoActiveWallet;

export const setPolkadotAddress = (addr: PolkadotAddress): PolkadotAddress =>
  (polkadotAddress = addr);
export const getPolkadotAddress = (): PolkadotAddress => polkadotAddress;

export const setPolkadotSignFxn = (fxn: PolkadotSignFxn): PolkadotSignFxn =>
  (polkadotSignFxn = fxn);
export const getPolkadotSignFxn = (): PolkadotSignFxn => polkadotSignFxn;

export const polkadotConnected = (): boolean => !!polkadotSignFxn;

export const setTruffleAddress = (addr: ETHAddress): ETHAddress => (truffleAddress = addr);
export const getTruffleAddress = (): ETHAddress => truffleAddress;
export const truffleConnected = (): boolean =>
  truffleAddress !== '' && truffleProvider !== undefined && truffleWeb3 !== undefined;

export const setTruffleProvider = (provider: HDWalletProvider): HDWalletProvider =>
  (truffleProvider = provider);
export const getTruffleProvider = (): HDWalletProvider | undefined => truffleProvider;

export const setTruffleWeb3 = (w3: Web3): Web3 => (truffleWeb3 = w3);
export const getTruffleWeb3 = (): Web3 | undefined => truffleWeb3;

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
      return ethAddress;
    case PostingMode.BATCHED_CARDANO:
      return cardanoAddress;
    case PostingMode.BATCHED_POLKADOT:
      return polkadotAddress;
    case PostingMode.AUTOMATIC:
      return truffleAddress;
    default:
      const errorCode = PaimaMiddlewareErrorCode.INTERNAL_INVALID_POSTING_MODE;
      throw new Error(paimaErrorMessageFxn(errorCode));
  }
};

export const getPostingInfo = (): PostingInfo => ({
  address: getActiveAddress(),
  postingModeString: getPostingModeString(),
});
