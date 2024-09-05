import type { ChainFunnel, FunnelJson, ReadPresyncDataFrom } from '@paima/runtime';
import type { ChainData, ChainDataExtension, PresyncChainData } from '@paima/sm';
import type { PoolClient } from 'pg';
import { ENV, type FUNNEL_PRESYNC_FINISHED } from '@paima/utils';
import type { FunnelCacheManager } from './FunnelCache.js';

export type FunnelSharedData = {
  mainNetworkApi: BaseFunnelSharedApi;
  extensions: ChainDataExtension[];
  readonly extensionsValid: boolean;
  readonly cacheManager: FunnelCacheManager;
};

export class BaseFunnelSharedApi {
  private startingBlockTimestamp: Promise<{ timestamp: number } | undefined> | undefined;

  public async getStartingBlock(): Promise<{ timestamp: number } | undefined> {
    return await (this.startingBlockTimestamp ??= this.getBlock(ENV.START_BLOCKHEIGHT));
  }

  public async getBlock(_height: number): Promise<{ timestamp: number } | undefined> {
    return undefined;
  }
}

/**
 * Base funnel that implements the bare-bones required functionality of the Paima Funnel
 */
export class BaseFunnel implements ChainFunnel {
  protected constructor(
    protected sharedData: FunnelSharedData,
    protected dbTx: PoolClient
  ) {
    // TODO: replace once TS5 decorators are better supported
    this.readData.bind(this);
    this.readPresyncData.bind(this);
    this.getDbTx.bind(this);
    this.configPrint.bind(this);
  }

  public async readData(_blockHeight: number): Promise<ChainData[]> {
    return [];
  }

  public async readPresyncData(
    _args: ReadPresyncDataFrom
  ): Promise<{ [caip2: number]: PresyncChainData[] | typeof FUNNEL_PRESYNC_FINISHED }> {
    return {};
  }

  public getDbTx(): PoolClient {
    return this.dbTx;
  }

  public configPrint(): FunnelJson {
    return {
      type: 'BaseFunnel',
    };
  }
}
