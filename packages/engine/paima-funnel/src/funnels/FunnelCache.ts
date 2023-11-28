import type { ChainData } from '@paima/sm';

export interface FunnelCacheEntry {
  /**
   * Delete all cache entries
   * This is used to invalidate all cached items due to a rollback or failure
   */
  clear: () => void;
}

export type CacheMapType = {
  [QueuedBlockCacheEntry.SYMBOL]?: QueuedBlockCacheEntry;
  [RpcCacheEntry.SYMBOL]?: RpcCacheEntry;
};
export class FunnelCacheManager {
  public cacheEntries: CacheMapType = {};

  public clear(): void {
    for (const entry of Object.getOwnPropertySymbols(this.cacheEntries) as Array<
      keyof CacheMapType
    >) {
      this.cacheEntries[entry]?.clear();
    }
  }
}

export class QueuedBlockCacheEntry implements FunnelCacheEntry {
  /** Blocks queued to be added into the current batch */
  public processingQueue: ChainData[];
  public static readonly SYMBOL = Symbol('QueuedBlockCacheEntry');

  constructor() {
    this.processingQueue = [];
  }

  clear: FunnelCacheEntry['clear'] = () => {
    while (this.processingQueue.length > 0) {
      this.processingQueue.pop();
    }
  };
}

export enum RpcRequestState {
  NotRequested,
  HasResult,
}
export type RpcRequestResult<T> =
  | { state: RpcRequestState.NotRequested }
  | { state: RpcRequestState.HasResult; result: T };

export class RpcCacheEntry implements FunnelCacheEntry {
  private rpcResult: Record<number, RpcRequestResult<number>> = {};
  public static readonly SYMBOL = Symbol('RpcCacheEntry');

  public updateState = (chainId: number, height: number): void => {
    this.rpcResult[chainId] = {
      state: RpcRequestState.HasResult,
      result: height,
    };
  };

  public getState(chainId: number): Readonly<RpcRequestResult<number>> {
    return (
      this.rpcResult[chainId] ?? {
        state: RpcRequestState.NotRequested,
      }
    );
  }

  clear: FunnelCacheEntry['clear'] = () => {
    this.rpcResult = {};
  };
}
