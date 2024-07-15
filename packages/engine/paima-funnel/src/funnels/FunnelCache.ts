import type { ChainData } from '@paima/sm';
import type pg from 'pg';

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
  [CarpFunnelCacheEntry.SYMBOL]?: CarpFunnelCacheEntry;
  [EvmFunnelCacheEntry.SYMBOL]?: EvmFunnelCacheEntry;
  [MinaFunnelCacheEntry.SYMBOL]?: MinaFunnelCacheEntry;
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

export type CarpFunnelCacheEntryState = {
  startingSlot: number;
  lastPoint: { blockHeight: number; timestamp: number } | undefined;
  epoch: number | undefined;
  cursors:
    | {
        [cdeName: string]: { cursor: string; finished: boolean };
      }
    | undefined;
};

export class CarpFunnelCacheEntry implements FunnelCacheEntry {
  private state: CarpFunnelCacheEntryState | null = null;
  public static readonly SYMBOL = Symbol('CarpFunnelStartingSlot');

  public updateStartingSlot(startingSlot: number): void {
    this.state = {
      startingSlot,
      lastPoint: this.state?.lastPoint,
      epoch: this.state?.epoch,
      cursors: this.state?.cursors,
    };
  }

  public updateLastPoint(blockHeight: number, timestamp: number): void {
    if (this.state) {
      this.state.lastPoint = { blockHeight, timestamp };
    }
  }

  public updateEpoch(epoch: number): void {
    if (this.state) {
      this.state.epoch = epoch;
    }
  }

  public updateCursor(cdeName: string, presyncCursor: { cursor: string; finished: boolean }): void {
    if (this.state) {
      if (!this.state.cursors) {
        this.state.cursors = {};
      }

      this.state.cursors[cdeName] = presyncCursor;
    }
  }

  public initialized(): boolean {
    return !!this.state;
  }

  public getState(): Readonly<CarpFunnelCacheEntryState> {
    if (!this.state) {
      throw new Error('[carp-funnel] Uninitialized cache entry');
    }
    return this.state;
  }

  clear: FunnelCacheEntry['clear'] = () => {
    this.state = null;
  };
}

export type EvmFunnelCacheEntryState = {
  bufferedChainData: ChainData[];
  timestampToBlockNumber: [number, number][];
  lastBlock: number | undefined;
  startBlockHeight: number;
  lastMaxTimestamp: number;
};

export class EvmFunnelCacheEntry implements FunnelCacheEntry {
  private cachedData: Record<number, RpcRequestResult<EvmFunnelCacheEntryState>> = {};
  public static readonly SYMBOL = Symbol('EvmFunnelCacheEntry');

  public updateState = (
    chainId: number,
    bufferedChainData: ChainData[],
    timestampToBlockNumber: [number, number][],
    startBlockHeight: number
  ): void => {
    this.cachedData[chainId] = {
      state: RpcRequestState.HasResult,
      result: {
        bufferedChainData,
        timestampToBlockNumber,
        startBlockHeight,
        lastBlock: undefined,
        lastMaxTimestamp: 0,
      },
    };
  };

  public getState(chainId: number): Readonly<RpcRequestResult<EvmFunnelCacheEntryState>> {
    return (
      this.cachedData[chainId] ?? {
        state: RpcRequestState.NotRequested,
      }
    );
  }

  clear: FunnelCacheEntry['clear'] = () => {
    this.cachedData = {};
  };
}

export type MinaFunnelCacheEntryState = {
  startingSlotTimestamp: number;
  lastPoint: { timestamp: number } | undefined;
  pg: pg.Client;
  cursors:
    | {
        [cdeName: string]: { cursor: string; finished: boolean };
      }
    | undefined;
};

export class MinaFunnelCacheEntry implements FunnelCacheEntry {
  private state: MinaFunnelCacheEntryState | null = null;
  public static readonly SYMBOL = Symbol('MinaFunnelStartingSlot');

  public updateStartingTimestamp(startingSlotTimestamp: number, pg: pg.Client): void {
    this.state = {
      startingSlotTimestamp,
      lastPoint: this.state?.lastPoint,
      cursors: this.state?.cursors,
      pg,
    };
  }

  public updateLastPoint(timestamp: number): void {
    if (this.state) {
      this.state.lastPoint = { timestamp };
    }
  }

  public updateCursor(cdeName: string, presyncCursor: { cursor: string; finished: boolean }): void {
    if (this.state) {
      if (!this.state.cursors) {
        this.state.cursors = {};
      }

      this.state.cursors[cdeName] = presyncCursor;
    }
  }

  public initialized(): boolean {
    return !!this.state;
  }

  public getState(): Readonly<MinaFunnelCacheEntryState> {
    if (!this.state) {
      throw new Error('[mina-funnel] Uninitialized cache entry');
    }
    return this.state;
  }

  clear: FunnelCacheEntry['clear'] = () => {
    this.state = null;
  };
}
