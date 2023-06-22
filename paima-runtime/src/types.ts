import type { Pool, PoolConfig } from 'pg';
import type { Express, RequestHandler } from 'express';

import type { SQLUpdate } from '@paima/db';
import type {
  Contract,
  ERC20Contract,
  ERC721Contract,
  ChainDataExtensionType,
  ChainDataExtensionDatumType,
  VersionString,
  SubmittedChainData,
  SubmittedData,
  PaimaERC721Contract,
  AbiItem,
} from '@paima/utils';

export { SubmittedChainData, SubmittedData };

export type TsoaFunction = (s: Express) => void;

export interface ChainData {
  timestamp: number;
  blockHash: string;
  blockNumber: number;
  submittedData: SubmittedData[];
  extensionDatums?: ChainDataExtensionDatum[];
}

export interface PresyncChainData {
  blockNumber: number;
  extensionDatums: ChainDataExtensionDatum[];
}

interface CdeDatumErc20TransferPayload {
  from: string;
  to: string;
  value: string;
}

interface CdeDatumErc721TransferPayload {
  from: string;
  to: string;
  tokenId: string;
}

interface CdeDatumErc721MintPayload {
  tokenId: string;
  mintData: string;
}

interface CdeDatumErc20DepositPayload {
  from: string;
  value: string;
}

type CdeDatumGenericPayload = any;

type ChainDataExtensionPayload =
  | CdeDatumErc20TransferPayload
  | CdeDatumErc721MintPayload
  | CdeDatumErc721TransferPayload
  | CdeDatumErc20DepositPayload
  | CdeDatumGenericPayload;

interface CdeDatumBase {
  cdeId: number;
  cdeDatumType: ChainDataExtensionDatumType;
  blockNumber: number;
  payload: ChainDataExtensionPayload;
}

export interface CdeErc20TransferDatum extends CdeDatumBase {
  cdeDatumType: ChainDataExtensionDatumType.ERC20Transfer;
  payload: CdeDatumErc20TransferPayload;
}

export interface CdeErc721TransferDatum extends CdeDatumBase {
  cdeDatumType: ChainDataExtensionDatumType.ERC721Transfer;
  payload: CdeDatumErc721TransferPayload;
}

export interface CdeErc721MintDatum extends CdeDatumBase {
  cdeDatumType: ChainDataExtensionDatumType.ERC721Mint;
  payload: CdeDatumErc721MintPayload;
  contractAddress: string;
  scheduledPrefix: string;
}

export interface CdeErc20DepositDatum extends CdeDatumBase {
  cdeDatumType: ChainDataExtensionDatumType.ERC20Deposit;
  payload: CdeDatumErc20DepositPayload;
  scheduledPrefix: string;
}

export interface CdeGenericDatum extends CdeDatumBase {
  cdeDatumType: ChainDataExtensionDatumType.Generic;
  payload: CdeDatumGenericPayload;
  scheduledPrefix: string;
}

export type ChainDataExtensionDatum =
  | CdeErc20TransferDatum
  | CdeErc721MintDatum
  | CdeErc721TransferDatum
  | CdeErc20DepositDatum
  | CdeGenericDatum;

type CdeContract = ERC20Contract | ERC721Contract | PaimaERC721Contract | Contract;

interface ChainDataExtensionBase {
  cdeId: number;
  cdeType: ChainDataExtensionType;
  cdeName: string;
  contract: CdeContract;
  contractAddress: string;
  startBlockHeight: number;
  scheduledPrefix: string;
}

export interface ChainDataExtensionErc20 extends ChainDataExtensionBase {
  cdeType: ChainDataExtensionType.ERC20;
  contract: ERC20Contract;
}

export interface ChainDataExtensionErc721 extends ChainDataExtensionBase {
  cdeType: ChainDataExtensionType.ERC721;
  contract: ERC721Contract;
}

export interface ChainDataExtensionPaimaErc721 extends ChainDataExtensionBase {
  cdeType: ChainDataExtensionType.PaimaERC721;
  contract: PaimaERC721Contract;
}

export interface ChainDataExtensionErc20Deposit extends ChainDataExtensionBase {
  cdeType: ChainDataExtensionType.ERC20Deposit;
  contract: ERC20Contract;
  depositAddress: string;
}

export interface ChainDataExtensionGeneric extends ChainDataExtensionBase {
  cdeType: ChainDataExtensionType.Generic;
  eventSignature: string;
  eventName: string;
  eventSignatureHash: string;
  rawContractAbi: string;
  contract: Contract;
}

export type ChainDataExtension =
  | ChainDataExtensionErc20
  | ChainDataExtensionErc721
  | ChainDataExtensionPaimaErc721
  | ChainDataExtensionErc20Deposit
  | ChainDataExtensionGeneric;

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
  dryRun: (gameInput: string, userAddress: string) => Promise<boolean>;
}

export interface PaimaRuntimeInitializer {
  initialize: (
    chainFunnel: ChainFunnel,
    gameStateMachine: GameStateMachine,
    gameBackendVersion: VersionString
  ) => PaimaRuntime;
}
