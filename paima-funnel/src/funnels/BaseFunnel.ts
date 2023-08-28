import type { ChainData, ChainDataExtension, ChainFunnel, PresyncChainData } from '@paima/runtime';
import { groupCdeData } from '../utils';
import { ENV, doLog } from '@paima/utils';
import type { PaimaL2Contract, Web3 } from '@paima/utils';
import { getUngroupedCdeData } from '../cde/reading';
import type { FunnelCacheManager } from './FunnelCache';

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
  protected constructor(protected sharedData: FunnelSharedData) {
    // TODO: replace once TS5 decorators are better supported
    this.readData.bind(this);
    this.readPresyncData.bind(this);
  }

  public async readData(_blockHeight: number): Promise<ChainData[]> {
    return [];
  }

  public async readPresyncData(_fromBlock: number, _toBlock: number): Promise<PresyncChainData[]> {
    return [];
  }
}
