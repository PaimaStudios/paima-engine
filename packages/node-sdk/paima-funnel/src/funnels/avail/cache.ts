import type { ChainData } from '@paima/sm';
import type { SubmittedData } from '@paima/chain-types';
import type { FunnelCacheEntry } from '../FunnelCache.js';

export type AvailFunnelCacheEntryState = {
  latestBlock: { hash: string; number: number; slot: number } | undefined;
  startingBlockHeight: number;
  bufferedChainData: ChainData[];
  timestampToBlock: [number, BlockData][];
  lastMaxSlot: number;
  lastBlock: number;
};

export type BlockData = {
  blockNumber: number;
  timestamp: number;
  submittedData: SubmittedData[];
  hash: string;
  slot: number;
};

export class AvailFunnelCacheEntry implements FunnelCacheEntry {
  private state: AvailFunnelCacheEntryState | null = null;
  public static readonly SYMBOL = Symbol('AvailFunnelStartingSlot');

  public initialized(): boolean {
    return !!this.state;
  }

  public initialize(startingBlockHeight: number): void {
    this.state = {
      latestBlock: undefined,
      startingBlockHeight: startingBlockHeight,
      bufferedChainData: [],
      timestampToBlock: [],
      lastMaxSlot: 0,
      lastBlock: 1,
    };
  }

  public updateLatestBlock(block: { hash: string; number: number; slot: number }): void {
    if (this.state) {
      this.state.latestBlock = block;
    }
  }

  public updateLastBlock(block: number): void {
    if (this.state) {
      this.state.lastBlock = block;
    }
  }

  public cacheBlocks(blocks: BlockData[]): void {
    if (!this.state) {
      throw new Error('[avail-funnel] Uninitialized cache entry');
    }

    for (const block of blocks) {
      this.state.timestampToBlock.push([block.timestamp, block]);

      this.state.latestBlock = {
        hash: block.hash,
        number: block.blockNumber,
        slot: block.slot,
      };
    }
  }

  public cleanOldEntries(maxTimestamp: number): void {
    if (!this.state) {
      throw new Error('[avail-funnel] Uninitialized cache entry');
    }

    while (true) {
      if (
        this.state.timestampToBlock.length > 0 &&
        this.state.timestampToBlock[0][0] <= maxTimestamp
      ) {
        this.state.timestampToBlock.shift();
      } else {
        break;
      }
    }
  }

  public updateLastMaxSlot(maxSlot: number): void {
    if (!this.state) {
      throw new Error('[avail-funnel] Uninitialized cache entry');
    }

    this.state.lastMaxSlot = maxSlot;
  }

  public getState(): Readonly<AvailFunnelCacheEntryState> {
    if (!this.state) {
      throw new Error('[avail-funnel] Uninitialized cache entry');
    }
    return this.state;
  }

  clear: FunnelCacheEntry['clear'] = () => {
    this.state = null;
  };
}
