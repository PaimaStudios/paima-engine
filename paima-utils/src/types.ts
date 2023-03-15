import type Web3 from 'web3';
import type { Express, RequestHandler } from 'express';
import type { PaimaL2Contract } from './contract-types/index';

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

type ChainDataExtensionDatum = any;
export interface ChainDataExtension {}

export interface ChainFunnel {
  nodeUrl: string;
  paimaL2ContractAddress: string;
  extensions: ChainDataExtension[];
  web3: Web3;
  paimaL2Contract: PaimaL2Contract;
  readData: (blockHeight: number) => Promise<ChainData[]>; // if using internalReadData
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
