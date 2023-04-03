import type { PreparedQuery } from '@pgtyped/query';
import type { Pool, PoolConfig } from 'pg';

import type {
  SubmittedData,
  ChainData,
  ChainFunnel,
  VersionString,
  PaimaRuntime,
  PresyncDataUnit,
  ChainDataExtension,
} from '@paima/utils';

export type SQLUpdate = [PreparedQuery<any, any>, any];

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
  getNewReadWriteDbConn: () => Pool;
  process: (chainData: ChainData) => Promise<void>;
  presyncProcess: (
    extensions: ChainDataExtension[],
    latestCdeData: PresyncDataUnit
  ) => Promise<void>;
  markPresyncMilestone: (blockHeight: number) => Promise<void>;
}

export interface PaimaRuntimeInitializer {
  initialize: (
    chainFunnel: ChainFunnel,
    gameStateMachine: GameStateMachine,
    gameBackendVersion: VersionString
  ) => PaimaRuntime;
}
