import type { Pool, PoolClient, PoolConfig } from 'pg';
import type { Express, RequestHandler } from 'express';

import type { SQLUpdate } from '@paima/db';
import type { ChainDataExtensionDatumType, ChainDataExtensionType } from '@paima/utils';
import type {
  Contract,
  ERC20Contract,
  ERC721Contract,
  VersionString,
  SubmittedChainData,
  SubmittedData,
  PaimaERC721Contract,
  ERC6551RegistryContract,
} from '@paima/utils';
import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';

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

interface CdeDatumErc6551RegistryPayload {
  accountCreated: string; // address
  implementation: string; // address
  chainId: string; // uint256
  tokenContract: string; // address
  tokenId: string; // uint256
  salt: string; // uint256
}

type ChainDataExtensionPayload =
  | CdeDatumErc20TransferPayload
  | CdeDatumErc721MintPayload
  | CdeDatumErc721TransferPayload
  | CdeDatumErc20DepositPayload
  // TODO: better type definition to avoid this issue
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  | CdeDatumGenericPayload
  | CdeDatumErc6551RegistryPayload;

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

export interface CdeErc6551RegistryDatum extends CdeDatumBase {
  cdeDatumType: ChainDataExtensionDatumType.ERC6551Registry;
  payload: CdeDatumErc6551RegistryPayload;
}

export type ChainDataExtensionDatum =
  | CdeErc20TransferDatum
  | CdeErc721MintDatum
  | CdeErc721TransferDatum
  | CdeErc20DepositDatum
  | CdeGenericDatum
  | CdeErc6551RegistryDatum;

export enum CdeEntryTypeName {
  Generic = 'generic',
  ERC20 = 'erc20',
  ERC20Deposit = 'erc20-deposit',
  ERC721 = 'erc721',
  ERC6551Registry = 'erc6551-registry',
}

const EvmAddress = Type.Transform(Type.RegExp('0x[0-9a-fA-F]{40}'))
  .Decode(value => value.toLowerCase())
  .Encode(value => value);

const ChainDataExtensionConfigBase = Type.Object({
  name: Type.String(),
  startBlockHeight: Type.Number(),
});
interface ChainDataExtensionBase {
  cdeId: number;
  hash: number; // hash of the CDE config that created this type
}

export const ChainDataExtensionErc20Config = Type.Intersect([
  ChainDataExtensionConfigBase,
  Type.Object({
    type: Type.Literal(CdeEntryTypeName.ERC20),
    contractAddress: EvmAddress,
  }),
]);
export type ChainDataExtensionErc20 = ChainDataExtensionBase &
  Static<typeof ChainDataExtensionErc20Config> & {
    cdeType: ChainDataExtensionType.ERC20;
    contract: ERC20Contract;
  };

export const ChainDataExtensionErc721Config = Type.Intersect([
  ChainDataExtensionConfigBase,
  Type.Object({
    type: Type.Literal(CdeEntryTypeName.ERC721),
    contractAddress: EvmAddress,
    scheduledPrefix: Type.String(),
  }),
]);
export type TChainDataExtensionErc721Config = Static<typeof ChainDataExtensionErc721Config>;

export type ChainDataExtensionErc721 = ChainDataExtensionBase &
  Static<typeof ChainDataExtensionErc721Config> & {
    cdeType: ChainDataExtensionType.ERC721;
    contract: ERC721Contract;
  };

/** same as ERC721, but with a different type flag (see isPaimaErc721) */
export type ChainDataExtensionPaimaErc721 = ChainDataExtensionBase &
  Static<typeof ChainDataExtensionErc721Config> & {
    cdeType: ChainDataExtensionType.PaimaERC721;
    contract: PaimaERC721Contract;
  };

export const ChainDataExtensionErc20DepositConfig = Type.Intersect([
  ChainDataExtensionConfigBase,
  Type.Object({
    type: Type.Literal(CdeEntryTypeName.ERC20Deposit),
    contractAddress: EvmAddress,
    scheduledPrefix: Type.String(),
    depositAddress: EvmAddress,
  }),
]);
export type ChainDataExtensionErc20Deposit = ChainDataExtensionBase &
  Static<typeof ChainDataExtensionErc20DepositConfig> & {
    cdeType: ChainDataExtensionType.ERC20Deposit;
    contract: ERC20Contract;
  };

export const ChainDataExtensionGenericConfig = Type.Intersect([
  ChainDataExtensionConfigBase,
  Type.Object({
    type: Type.Literal(CdeEntryTypeName.Generic),
    contractAddress: EvmAddress,
    abiPath: Type.String(),
    eventSignature: Type.String(),
    scheduledPrefix: Type.String(),
  }),
]);
export type TChainDataExtensionGenericConfig = Static<typeof ChainDataExtensionGenericConfig>;
export type ChainDataExtensionGeneric = ChainDataExtensionBase &
  Omit<Static<typeof ChainDataExtensionGenericConfig>, 'abiPath'> & {
    cdeType: ChainDataExtensionType.Generic;
    eventName: string;
    eventSignatureHash: string;
    rawContractAbi: string;
    contract: Contract;
  };

export const ChainDataExtensionErc6551RegistryConfig = Type.Intersect([
  ChainDataExtensionConfigBase,
  Type.Object({
    type: Type.Literal(CdeEntryTypeName.ERC6551Registry),
    contractAddress: Type.Optional(EvmAddress),
    implementation: Type.Optional(EvmAddress),
    tokenContract: Type.Optional(EvmAddress),
    tokenId: Type.Optional(Type.String()), // uint256
    salt: Type.Optional(Type.String()), // uint256
  }),
]);
export type ChainDataExtensionErc6551Registry = ChainDataExtensionBase &
  Static<typeof ChainDataExtensionErc6551RegistryConfig> & {
    cdeType: ChainDataExtensionType.ERC6551Registry;
    contract: ERC6551RegistryContract;
  };

export const CdeConfig = Type.Object({
  extensions: Type.Array(
    Type.Union([
      ChainDataExtensionErc20Config,
      ChainDataExtensionErc721Config,
      ChainDataExtensionErc20DepositConfig,
      ChainDataExtensionGenericConfig,
      ChainDataExtensionErc6551RegistryConfig,
    ])
  ),
});

/**
 * We check a base config before checking the full configuration
 * This is because validation logic doesn't know `type` is a special key
 * that should be used to decide what the type of all other keys should be
 */
export const CdeBaseConfig = Type.Object({
  extensions: Type.Array(
    Type.Object({
      name: Type.String(),
      type: Type.Enum(CdeEntryTypeName),
    })
  ),
});
export type ChainDataExtension =
  | ChainDataExtensionErc20
  | ChainDataExtensionErc721
  | ChainDataExtensionPaimaErc721
  | ChainDataExtensionErc20Deposit
  | ChainDataExtensionGeneric
  | ChainDataExtensionErc6551Registry;

export interface ChainFunnel {
  readData: (blockHeight: number) => Promise<ChainData[]>;
  readPresyncData: (fromBlock: number, toBlock: number) => Promise<PresyncChainData[]>;
  getDbTx(): PoolClient;
}

export interface IFunnelFactory {
  getExtensions: () => ChainDataExtension[];
  extensionsAreValid: () => boolean;
  clearCache: () => void;

  generateFunnel(dbTx: PoolClient): Promise<ChainFunnel>;
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
  DBConn: PoolClient
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
  latestProcessedBlockHeight: (dbTx?: PoolClient | Pool) => Promise<number>;
  getPresyncBlockHeight: (dbTx?: PoolClient | Pool) => Promise<number>;
  getReadonlyDbConn: () => Pool;
  getReadWriteDbConn: () => Pool;
  process: (dbTx: PoolClient, chainData: ChainData) => Promise<void>;
  presyncProcess: (dbTx: PoolClient, latestCdeData: PresyncChainData) => Promise<void>;
  markPresyncMilestone: (blockHeight: number) => Promise<void>;
  dryRun: (gameInput: string, userAddress: string) => Promise<boolean>;
}

export interface PaimaRuntimeInitializer {
  initialize: (
    funnelFactory: IFunnelFactory,
    gameStateMachine: GameStateMachine,
    gameBackendVersion: VersionString
  ) => PaimaRuntime;
}
