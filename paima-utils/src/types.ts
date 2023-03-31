import type Web3 from 'web3';
import type { Express, RequestHandler } from 'express';

import type { PaimaL2Contract } from './contract-types/index';
import type { ChainDataExtensionType } from './constants';

export type Deployment = 'C1' | 'A1';

export type ErrorCode = number;
export type ErrorMessageFxn = (errorCode: ErrorCode) => string;
export type ErrorMessageMapping = Record<ErrorCode, string>;

export type ETHAddress = string;
export type CardanoAddress = string;
export type PolkadotAddress = string;
export type WalletAddress = ETHAddress | CardanoAddress | PolkadotAddress;

export type ContractAddress = ETHAddress;

export type Hash = string;
export type URI = string;
export type UserSignature = string;

export type VersionString = `${number}.${number}.${number}`;

export type TsoaFunction = (s: Express) => void;

export type TransactionTemplate = {
  data: string;
  to: string;
  gasPrice: string;
};

type NonceString = string;
export type InputDataString = string;
export interface SubmittedData {
  userAddress: WalletAddress;
  inputData: InputDataString;
  inputNonce: NonceString;
  suppliedValue: string;
  scheduled: boolean;
}
export type SubmittedChainData = SubmittedData;

export interface ChainData {
  timestamp: number | string;
  blockHash: string;
  blockNumber: number;
  submittedData: SubmittedData[];
  extensionDatums?: ChainDataExtensionDatum[];
}

interface ChainDataExtensionErc20Payload {
  from: string;
  to: string;
  value: string;
}

interface ChainDataExtensionErc721Payload {
  from: string;
  to: string;
  tokenId: string;
}

type ChainDataExtensionPayload = ChainDataExtensionErc20Payload | ChainDataExtensionErc721Payload;

interface ChainDataExtensionDatumBase {
  cdeId: number;
  cdeType: ChainDataExtensionType;
  blockNumber: number;
  payload: ChainDataExtensionPayload;
}

interface ChainDataExtensionErc20Datum extends ChainDataExtensionDatumBase {
  cdeType: ChainDataExtensionType.ERC20;
  payload: ChainDataExtensionErc20Payload;
}

export interface ChainDataExtensionErc721Datum extends ChainDataExtensionDatumBase {
  cdeType: ChainDataExtensionType.ERC721;
  payload: ChainDataExtensionErc721Payload;
}

export type ChainDataExtensionDatum = ChainDataExtensionErc20Datum | ChainDataExtensionErc721Datum;

export interface ChainDataExtension {
  cdeId: number;
  cdeType: ChainDataExtensionType;
  contractAddress: string;
  startBlockHeight: number;
  initializationPrefix: string;
}

export interface ChainFunnel {
  nodeUrl: string;
  paimaL2ContractAddress: string;
  extensions: ChainDataExtension[];
  web3: Web3;
  paimaL2Contract: PaimaL2Contract;
  readData: (blockHeight: number) => Promise<ChainData[]>;
  presyncRead: (fromBlock: number, toBlock: number) => Promise<ChainDataExtensionDatum[][]>;
}

export interface PaimaRuntime {
  pollingRate: number;
  setPollingRate: (n: number) => void;
  chainDataExtensions: ChainDataExtension[];
  addExtensions: (e: ChainDataExtension[]) => void;
  addGET: (route: string, callback: RequestHandler) => void;
  addPOST: (route: string, callback: RequestHandler) => void;
  addEndpoints: (t: TsoaFunction) => void;
  run: (stopBlockHeight: number | null, serverOnlyMode?: boolean) => Promise<void>;
}
