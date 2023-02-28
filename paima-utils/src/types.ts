import type Web3 from 'web3';
import type { PreparedQuery } from '@pgtyped/query';
import type { Express, RequestHandler } from 'express';
import type { Pool, PoolConfig } from 'pg';
import type { Storage as StorageContract } from './contract-types/index';

export type ErrorCode = number;
export type ErrorMessageFxn = (errorCode: ErrorCode) => string;
export type ErrorMessageMapping = Record<ErrorCode, string>;

export type ETHAddress = string;

export type SQLUpdate = [PreparedQuery<any, any>, any];

export type VersionString = `${number}.${number}.${number}`;

export type TsoaFunction = (s: Express) => void;

export type TransactionTemplate = {
  data: string;
  to: string;
  gasPrice: string;
};

type NonceString = string;
type EncodedGameDataString = string;
export interface SubmittedChainData {
  userAddress: ETHAddress;
  inputData: EncodedGameDataString;
  inputNonce: NonceString;
  suppliedValue: string;
}

export interface ChainData {
  timestamp: number | string;
  blockHash: string;
  blockNumber: number;
  submittedData: SubmittedChainData[];
  extensionDatums?: ChainDataExtensionDatum[];
}

type ChainDataExtensionDatum = any;
type METHOD = 'GET' | 'POST';
export interface ChainDataExtension {}

export interface ChainFunnel {
  nodeUrl: string;
  storageAddress: string;
  extensions: ChainDataExtension[];
  web3: Web3;
  storage: StorageContract;
  readData: (blockHeight: number) => Promise<ChainData[]>; // if using internalReadData
}

export type GameStateTransitionFunctionRouter = (
  blockHeight: number
) => GameStateTransitionFunction;

export type GameStateTransitionFunction = (
  inputData: SubmittedChainData,
  blockHeight: number,
  randomnessGenerator: any,
  DBConn: Pool
) => Promise<SQLUpdate[]>;

export interface GameStateMachineInitializer {
  initialize: (
    databaseInfo: PoolConfig,
    randomnessProtocolEnum: number,
    gameStateTransitionRouter: GameStateTransitionFunctionRouter,
    startBlockHeight: number
  ) => GameStateMachine;
}

export interface GameStateMachine {
  latestBlockHeight: () => Promise<number>;
  getReadonlyDbConn: () => Pool;
  process: (chainData: ChainData) => Promise<void>;
}

export interface PaimaRuntimeInitializer {
  initialize: (
    chainFunnel: ChainFunnel,
    gameStateMachine: GameStateMachine,
    gameBackendVersion: VersionString
  ) => PaimaRuntime;
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
