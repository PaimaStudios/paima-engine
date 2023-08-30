import type { ChainData, ChainDataExtension, ChainFunnel, PresyncChainData } from '@paima/runtime';
import type { PaimaL2Contract, Web3 } from '@paima/utils';
import type { FunnelCacheManager } from './FunnelCache';
import type { PoolClient } from 'pg';

export type FunnelSharedData = {
  readonly web3: Web3;
  readonly paimaL2Contract: PaimaL2Contract;
  readonly extensions: ChainDataExtension[];
  readonly extensionsValid: boolean;
  readonly cacheManager: FunnelCacheManager;
};

/**
 * Base funnel that implements the bare-bones required functionality of the Paima Funnel
 */
export class BaseFunnel implements ChainFunnel {
  protected constructor(protected sharedData: FunnelSharedData, protected dbTx: PoolClient) {
    // TODO: replace once TS5 decorators are better supported
    this.readData.bind(this);
    this.readPresyncData.bind(this);
    this.getDbTx.bind(this);
  }

  public async readData(_blockHeight: number): Promise<ChainData[]> {
    return [];
  }

  public async readPresyncData(_fromBlock: number, _toBlock: number): Promise<PresyncChainData[]> {
    return [];
  }

  public getDbTx(): PoolClient {
    return this.dbTx;
  }
}
