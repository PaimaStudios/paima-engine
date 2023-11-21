import type { PoolClient } from 'pg';
import type { Express, RequestHandler } from 'express';
import type {
  VersionString,
  SubmittedChainData,
  SubmittedData,
  Network,
  FUNNEL_PRESYNC_FINISHED,
} from '@paima/utils';
import type { ChainData, PresyncChainData, ChainDataExtension, GameStateMachine } from '@paima/sm';

export { SubmittedChainData, SubmittedData };

export type TsoaFunction = (s: Express) => void;

export type ReadPresyncDataFrom = {
  network: Network;
  from: number;
  to: number;
}[];

export interface ChainFunnel {
  readData: (blockHeight: number) => Promise<ChainData[]>;
  readPresyncData: (
    args: ReadPresyncDataFrom
  ) => Promise<{ [network: number]: PresyncChainData[] | typeof FUNNEL_PRESYNC_FINISHED }>;
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

export interface PaimaRuntimeInitializer {
  initialize: (
    funnelFactory: IFunnelFactory,
    gameStateMachine: GameStateMachine,
    gameBackendVersion: VersionString
  ) => PaimaRuntime;
}
