import type Web3 from 'web3';
import type { PreparedQuery } from '@pgtyped/query';
import type { Express, RequestHandler } from 'express';
import type { Pool, PoolConfig } from 'pg';
import type { Storage as StorageContract } from './contract-types/index';

export type ErrorCode = number;
export type ErrorMessageFxn = (errorCode: ErrorCode) => string;
export type ErrorMessageMapping = Record<ErrorCode, string>;

export interface ChainDataExtension {}

export type TransactionTemplate = {
  data: string;
  to: string;
  gasPrice: string;
};

export interface ChainFunnel {
  nodeUrl: string;
  storageAddress: string;
  extensions: ChainDataExtension[];
  web3: Web3;
  storage: StorageContract;
  readData: (blockHeight: number) => Promise<ChainData[] | undefined>; // if using internalReadData
}
export type ETHAddress = string;

export type SQLUpdate = [PreparedQuery<any, any>, any];

type EncodedGameDataString = string;
type NonceString = string;
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

export type GameStateTransitionFunctionRouter = (
  blockHeight: number
) => GameStateTransitionFunction;
export type GameStateTransitionFunction = (
  executionMode: ExecutionModeEnum,
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
  process: (chainData: ChainData, executionMode: ExecutionModeEnum) => Promise<void>;
}
export type VersionString = `${number}.${number}.${number}`;
export type ExecutionModeEnum = 'Parallel' | 'Sequential';
export interface PaimaRuntimeInitializer {
  initialize: (
    executionMode: ExecutionModeEnum,
    chainFunnel: ChainFunnel,
    gameStateMachine: GameStateMachine,
    gameBackendVersion: VersionString
  ) => PaimaRuntime;
}
export type TsoaFunction = (s: Express) => void;
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
