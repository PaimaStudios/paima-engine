import type { PreparedQuery } from '@pgtyped/query';
import type { Express, RequestHandler } from 'express';
import type { Pool, PoolConfig } from 'pg';

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
  inputData: SubmittedChainData,
  blockHeight: number,
  randomnessGenerator: any,
  DBConn: Pool
) => Promise<SQLUpdate[]>;
export interface GameStateMachineInitializer {
  initialize: (
    databaseInfo: PoolConfig,
    randomnessProtocolEnum: any,
    gameStateTransitionRouter: GameStateTransitionFunctionRouter,
    startBlockHeight: number
  ) => GameStateMachine;
}
export interface GameStateMachine {
  latestBlockHeight: () => Promise<number>;
  process: (chainData: ChainData) => Promise<void>;
}
export type VersionString = `${number}.${number}.${number}`;
export interface PaimaRuntimeInitializer {
  initialize: (
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
  run: () => Promise<void>;
}
