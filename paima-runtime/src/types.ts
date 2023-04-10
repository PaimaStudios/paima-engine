import type { Pool, PoolConfig } from 'pg';
import type { Express, RequestHandler } from 'express';

import type { SQLUpdate } from '@paima/db';
import type {
  ERC20Contract,
  ERC721Contract,
  ChainDataExtensionType,
  InputDataString,
  VersionString,
  WalletAddress,
} from '@paima/utils';

export type TsoaFunction = (s: Express) => void;

type NonceString = string;

export interface SubmittedData {
  userAddress: WalletAddress;
  inputData: InputDataString;
  inputNonce: NonceString;
  suppliedValue: string;
  scheduled: boolean;
}
export type SubmittedChainData = SubmittedData;

export interface BlockData {
  timestamp: number | string;
  blockHash: string;
  blockNumber: number;
}

export interface ChainData {
  timestamp: number | string;
  blockHash: string;
  blockNumber: number;
  submittedData: SubmittedData[];
  extensionDatums?: ChainDataExtensionDatum[];
}

export interface PresyncChainData {
  blockNumber: number;
  extensionDatums: ChainDataExtensionDatum[];
}

export interface BlockSubmittedData {
  blockNumber: number;
  submittedData: SubmittedData[];
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
  contractAddress: string;
  initializationPrefix: string;
}

export type ChainDataExtensionDatum = ChainDataExtensionErc20Datum | ChainDataExtensionErc721Datum;

export interface ChainDataExtension {
  cdeId: number;
  cdeType: ChainDataExtensionType;
  contractAddress: string;
  startBlockHeight: number;
  initializationPrefix: string;
}

interface InstantiatedChainDataExtensionErc20 extends ChainDataExtension {
  cdeType: ChainDataExtensionType.ERC20;
  contract: ERC20Contract;
}

interface InstantiatedChainDataExtensionErc721 extends ChainDataExtension {
  cdeType: ChainDataExtensionType.ERC721;
  contract: ERC721Contract;
}

export type InstantiatedChainDataExtension =
  | InstantiatedChainDataExtensionErc20
  | InstantiatedChainDataExtensionErc721;

export interface ChainFunnel {
  getExtensions: () => ChainDataExtension[];
  readData: (blockHeight: number) => Promise<ChainData[]>;
  readPresyncData: (fromBlock: number, toBlock: number) => Promise<PresyncChainData[]>;
}

export interface PaimaRuntime {
  pollingRate: number;
  setPollingRate: (n: number) => void;
  addGET: (route: string, callback: RequestHandler) => void;
  addPOST: (route: string, callback: RequestHandler) => void;
  addEndpoints: (t: TsoaFunction) => void;
  run: (stopBlockHeight: number | null, serverOnlyMode?: boolean) => Promise<void>;
}

export type GameStateTransitionFunctionRouter = (
  blockHeight: number
) => GameStateTransitionFunction;

export type GameStateTransitionFunction = (
  inputData: SubmittedData,
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
  initializeDatabase: (force: boolean) => Promise<boolean>;
  presyncStarted: () => Promise<boolean>;
  syncStarted: () => Promise<boolean>;
  latestProcessedBlockHeight: () => Promise<number>;
  getPresyncBlockHeight: () => Promise<number>;
  getReadonlyDbConn: () => Pool;
  getReadWriteDbConn: () => Pool;
  process: (chainData: ChainData) => Promise<void>;
  presyncProcess: (latestCdeData: PresyncChainData) => Promise<void>;
  markPresyncMilestone: (blockHeight: number) => Promise<void>;
}

export interface PaimaRuntimeInitializer {
  initialize: (
    chainFunnel: ChainFunnel,
    gameStateMachine: GameStateMachine,
    gameBackendVersion: VersionString
  ) => PaimaRuntime;
}
