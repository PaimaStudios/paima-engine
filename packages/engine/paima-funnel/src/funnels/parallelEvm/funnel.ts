import type { OtherEvmConfig, Web3 } from '@paima/utils';
import {
  doLog,
  initWeb3,
  logError,
  timeout,
  delay,
  InternalEventType,
  ChainDataExtensionType,
} from '@paima/utils';
import type { ChainFunnel, ReadPresyncDataFrom } from '@paima/runtime';
import { type ChainData, type EvmPresyncChainData, type PresyncChainData } from '@paima/sm';
import { getUngroupedCdeData } from '../../cde/reading.js';
import { composeChainData, groupCdeData } from '../../utils.js';
import { BaseFunnel } from '../BaseFunnel.js';
import type { FunnelSharedData } from '../BaseFunnel.js';
import type { EvmFunnelCacheEntryState } from '../FunnelCache.js';
import { EvmFunnelCacheEntry, RpcCacheEntry, RpcRequestState } from '../FunnelCache.js';
import type { PoolClient } from 'pg';
import { FUNNEL_PRESYNC_FINISHED } from '@paima/utils';
import { fetchDynamicPrimitives, getMultipleBlockData } from '../../reading.js';
import { getLatestProcessedCdeBlockheight } from '@paima/db';

const GET_BLOCK_NUMBER_TIMEOUT = 5000;

function applyDelay(config: OtherEvmConfig, baseTimestamp: number): number {
  return Math.max(baseTimestamp - (config.delay ?? 0), 0);
}

export class ParallelEvmFunnel extends BaseFunnel implements ChainFunnel {
  config: OtherEvmConfig;
  chainName: string;

  protected constructor(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    config: OtherEvmConfig,
    chainName: string,
    private readonly baseFunnel: ChainFunnel,
    private readonly web3: Web3
  ) {
    super(sharedData, dbTx);
    this.readData.bind(this);
    this.readPresyncData.bind(this);
    this.getDbTx.bind(this);
    this.config = config;
    this.chainName = chainName;
  }

  public override async readData(blockHeight: number): Promise<ChainData[]> {
    const cachedState = this.getState();

    // if in the previous round we couldn't return some blocks because the
    // parallel chain didn't get far enough, we first process those.
    if (cachedState.bufferedChainData.length === 0) {
      const baseData = await this.baseFunnel.readData(blockHeight);
      cachedState.bufferedChainData.push(...baseData);
    }

    const latestBlockQueryState = this.latestBlock();
    const latestBlock = await this.web3.eth.getBlock(latestBlockQueryState);

    const chainData: ChainData[] = [];

    // filter the data so that we are sure we can get all the blocks in the range
    for (const data of cachedState.bufferedChainData) {
      if (applyDelay(this.config, data.timestamp) <= Number(latestBlock.timestamp)) {
        chainData.push(data);
      }
    }

    // the blocks that didn't pass the filter are kept in the cache, so that
    // the block funnel doesn't get them again.
    chainData.forEach(_ => cachedState.bufferedChainData.shift());

    if (chainData.length === 0) {
      return chainData;
    }

    if (!cachedState.lastBlock) {
      const queryResults = await getLatestProcessedCdeBlockheight.run(
        { network: this.chainName },
        this.dbTx
      );

      if (queryResults[0]) {
        // If we are in `readData`, we know that the presync stage finished.
        // This means `readPresyncData` was actually called with the entire
        // range up to startBlockHeight - 1 (inclusive), since that's the stop
        // condition for the presync. So there is no point in starting from
        // earlier than that, since we know there are no events there.
        cachedState.lastBlock = Math.max(
          queryResults[0].block_height,
          cachedState.startBlockHeight - 1
        );
      } else {
        // The earliest parallel block we might have to sync
        // is one whose timestamp occurs after the timestamp of (current block - 1)
        const block = await this.sharedData.web3.eth.getBlock(chainData[0].blockNumber - 1);
        const ts = Number(block.timestamp);
        const earliestParallelChainBlock = await findBlockByTimestamp(
          this.web3,
          applyDelay(this.config, ts),
          this.chainName
        );
        // earliestParallelChainBlock is the earliest block that we might need to include
        // so earliestParallelChainBlock-1 is the first block we can ignore (the "lastBlock" we're done syncing)
        cachedState.lastBlock = earliestParallelChainBlock - 1;
      }
    }

    const maxTimestamp = applyDelay(this.config, chainData[chainData.length - 1].timestamp);

    const blocks = [];

    while (true) {
      const latestBlock = this.latestBlock();

      const to = Math.min(latestBlock, cachedState.lastBlock + this.config.funnelBlockGroupSize);
      // we need to fetch the blocks in order to know the timestamps, so that we
      // can make a mapping from the trunk chain to the parallel chain.

      doLog(`ParallelEvm funnel ${this.config.chainId}: #${cachedState.lastBlock + 1}-${to}`);

      const parallelEvmBlocks = await getMultipleBlockData(
        this.web3,
        cachedState.lastBlock + 1,
        to,
        this.chainName
      );

      blocks.push(...parallelEvmBlocks);

      // this has to be > instead of >=
      // because there can be multiple blocks with the same timestamp (e.g. Arbitrum)
      if (blocks.length > 0 && blocks[blocks.length - 1].timestamp > maxTimestamp) {
        break;
      }

      if (blocks.length > 0) {
        cachedState.lastBlock = blocks[blocks.length - 1].blockNumber;
      }

      // We reach this part of the code if after we fetch blocks we still aren't done syncing.
      // There are 2 cases for this:
      // 1. We're still far behind the tip and we're catching up
      // For case (1), we can fetch more blocks right away (no need to update our cached latest block or delay)
      if (to !== latestBlock) continue;
      // 2. We're at the tip and we're waiting for more parallel chains blocks to be made to finalize the block
      // For case (2), we try update our cached latest block number in case it's stale,
      // and delay if we are truly waiting for more blocks to be made
      while ((await this.updateLatestBlock()) === latestBlock) {
        // wait for blocks to be produced
        await delay(500);
      }
    }

    for (const parallelChainBlock of blocks) {
      cachedState.timestampToBlockNumber.push([
        parallelChainBlock.timestamp,
        parallelChainBlock.blockNumber,
      ]);

      cachedState.lastBlock = parallelChainBlock.blockNumber;
    }

    // remove old entries from the timestamp to block mapping, so that it
    // doesn't grow forever, since it's cached.
    while (true) {
      if (cachedState.timestampToBlockNumber.length === 0) {
        return chainData;
      }

      // this is the timestamp from the previous round, since every block before
      // that point should have been included in the range.
      //
      // we can't use the minimum timestamp of the current round since there
      // could be blocks with a timestamp in the middle of both
      if (cachedState.timestampToBlockNumber[0][0] <= cachedState.lastMaxTimestamp) {
        cachedState.timestampToBlockNumber.shift();
      } else {
        break;
      }
    }

    cachedState.lastMaxTimestamp = maxTimestamp;

    //  Now we need to join the parallel evm chain with the trunk.
    //
    //  We use the cached timestamp to block number mapping to build the
    // following objects. It's important the we used the cached data and not the
    // data that we just fetched, since in the previous round we may had fetched
    // extra blocks.
    //  For example: if we previously had timestamps:
    //
    // Round 1:
    //    Base chain pull: [1, 2, 3]
    //    This chain pull: [1, 2, 3, 4]
    // Round 2:
    //    Base chain pull: [4]
    //    This chain pull: [5]
    //
    //  We would want to merge this new base block with the last from the
    // previous round (timestamp 4).
    //
    //  We know that this block is still in the cached state, because we only
    // removed blocks with timestamp <= 3 (maxTimestamp). If we used the blocks from the current
    // call then instead we would map the block to the one with timestamp 5,
    // breaking the invariant.
    //
    // This maps timestamps from the sidechain to the mainchain.
    const sidechainToMainchainBlockHeightMapping: { [blockNumber: number]: number } = {};

    // Mapping of mainchain to sidechain block heights
    const mainchainToSidechainBlockHeightMapping: { [blockNumber: number]: number } = {};

    // chainData is sorted by timestamp, so we never need to search old entries,
    // we keep this around to know from where to start searching for a block
    // from the original chain that has a timestamp >= than the current
    // sidechain block.
    let currIndex = 0;

    for (const parallelChainBlock of cachedState.timestampToBlockNumber) {
      while (currIndex < chainData.length) {
        if (applyDelay(this.config, chainData[currIndex].timestamp) >= parallelChainBlock[0]) {
          sidechainToMainchainBlockHeightMapping[parallelChainBlock[1]] =
            chainData[currIndex].blockNumber;

          mainchainToSidechainBlockHeightMapping[chainData[currIndex].blockNumber] =
            parallelChainBlock[1];
          break;
        } else {
          currIndex++;
        }
      }
    }

    if (!cachedState.timestampToBlockNumber[0]) {
      return chainData;
    }

    // It's unlikely, but possible, that we did only fetch data outside the main
    // chain range. In this case the condition below will make us return
    // directly the base chain data.  If there is at least one block that gets
    // merged then this gets handled by `getUpperBoundBlock`.
    if (cachedState.timestampToBlockNumber[0][0] > maxTimestamp) {
      return chainData;
    }

    // since we removed old entries, the first one has the first block from the
    // parallel chain that we need to fetch.
    const fromBlock = cachedState.timestampToBlockNumber[0][1];

    let toBlock =
      getUpperBoundBlock(cachedState.timestampToBlockNumber, maxTimestamp) ||
      // this works because we know that there is at least a block in the time
      // range, because of the previous if/early return.
      fromBlock;

    if (!toBlock || fromBlock < 0 || toBlock < fromBlock) {
      return chainData;
    }

    let data: ChainData[];

    if (toBlock === fromBlock) {
      doLog(`EVM CDE funnel ${this.config.chainId}: #${toBlock}`);
      data = await this.internalReadDataSingle(
        fromBlock,
        chainData[0],
        blockNumber => sidechainToMainchainBlockHeightMapping[blockNumber]
      );
    } else {
      doLog(`EVM CDE funnel ${this.config.chainId}: #${fromBlock}-${toBlock}`);
      data = await this.internalReadDataMulti(
        fromBlock,
        toBlock,
        chainData,
        blockNumber => sidechainToMainchainBlockHeightMapping[blockNumber]
      );
    }

    // This adds the internal event that updates the last block point. This is
    // mostly to avoid having to do a binary search each time we boot the
    // engine. Since we need to know from where to start searching for blocks in
    // the timestamp range.
    for (const chainData of data) {
      const originalBlockNumber = mainchainToSidechainBlockHeightMapping[chainData.blockNumber];
      // it's technically possible for this to be null, because there may not be
      // a block of the sidechain in between a particular pair of blocks or the
      // original chain.
      //
      // in this case it could be more optimal to set the block number here to
      // the one in the next block, but it shouldn't make much of a difference.
      if (!originalBlockNumber) {
        continue;
      }

      if (!chainData.internalEvents) {
        chainData.internalEvents = [];
      }
      chainData.internalEvents.push({
        type: InternalEventType.EvmLastBlock,
        // this is the block number in the original chain, so that we can resume
        // from that point later.
        //
        // there can be more than one block here, for example, if the main
        // chain produces a block every 10 seconds, and the parallel chain
        // generates a block every second, then there can be 10 blocks.
        // The block here will be the last in the range. Losing the
        // information doesn't matter because there is a transaction per main
        // chain block, so the result would be the same.
        block: originalBlockNumber,
        network: this.chainName,
      });
    }

    return data;
  }

  private internalReadDataSingle = async (
    blockNumber: number,
    baseChainData: ChainData,
    sidechainToMainchainNumber: (blockNumber: number) => number
  ): Promise<ChainData[]> => {
    if (blockNumber < 0) {
      return [];
    }
    try {
      const dynamicPrimitives = await fetchDynamicPrimitives(
        blockNumber,
        blockNumber,
        this.web3,
        this.sharedData,
        this.chainName
      );

      const cdeData = (
        await getUngroupedCdeData(
          this.web3,
          this.sharedData.extensions.filter(
            extension =>
              extension.network === this.chainName &&
              extension.cdeType !== ChainDataExtensionType.DynamicPrimitive
          ),
          blockNumber,
          blockNumber,
          this.chainName
        )
      ).concat(dynamicPrimitives);

      for (const extensionData of cdeData) {
        for (const data of extensionData) {
          const mappedBlockNumber = sidechainToMainchainNumber(data.blockNumber);

          data.blockNumber = mappedBlockNumber;
        }
      }

      return [
        {
          ...baseChainData,
          extensionDatums: baseChainData.extensionDatums?.concat(cdeData.flat()) || cdeData.flat(),
        },
      ];
    } catch (err) {
      doLog(`[funnel] at ${blockNumber} caught ${err}`);
      throw err;
    }
  };

  private internalReadDataMulti = async (
    fromBlock: number,
    toBlock: number,
    baseChainData: ChainData[],
    sidechainToMainchainNumber: (blockNumber: number) => number
  ): Promise<ChainData[]> => {
    if (toBlock < fromBlock || fromBlock < 0) {
      return [];
    }

    try {
      const dynamicPrimitives = await fetchDynamicPrimitives(
        fromBlock,
        toBlock,
        this.web3,
        this.sharedData,
        this.chainName
      );

      const ungroupedCdeData = (
        await getUngroupedCdeData(
          this.web3,
          this.sharedData.extensions.filter(
            extension =>
              extension.network === this.chainName &&
              extension.cdeType !== ChainDataExtensionType.DynamicPrimitive
          ),
          fromBlock,
          toBlock,
          this.chainName
        )
      ).concat(dynamicPrimitives);

      let mappedFrom: number | undefined;
      let mappedTo: number | undefined;

      // This needs to be done here for groupCdeData to work correctly, since
      // there can be different parallel chain blocks assigned to the same main
      // chain block, and those need to be grouped together in order for
      // composeChainData to work.
      for (const extensionData of ungroupedCdeData) {
        for (const data of extensionData) {
          const mappedBlockNumber = sidechainToMainchainNumber(data.blockNumber);

          data.blockNumber = mappedBlockNumber;

          if (!mappedFrom) {
            mappedFrom = data.blockNumber;
          }

          mappedTo = data.blockNumber;
        }
      }

      let cdeData: EvmPresyncChainData[] = [];

      if (mappedFrom && mappedTo) {
        cdeData = groupCdeData(this.chainName, mappedFrom, mappedTo, ungroupedCdeData);
      }

      return composeChainData(baseChainData, cdeData);
    } catch (err) {
      doLog(`[funnel] at ${fromBlock}-${toBlock} caught ${err}`);
      throw err;
    }
  };

  public override async readPresyncData(
    args: ReadPresyncDataFrom
  ): Promise<{ [network: string]: PresyncChainData[] | typeof FUNNEL_PRESYNC_FINISHED }> {
    const baseData = await this.baseFunnel.readPresyncData(args);

    let arg = args.find(arg => arg.network == this.chainName);

    if (!arg) {
      return baseData;
    }

    let fromBlock = arg.from;
    let toBlock = arg.to;

    const startBlockHeight = this.getState().startBlockHeight;

    if (fromBlock >= startBlockHeight) {
      return { ...baseData, [this.chainName]: FUNNEL_PRESYNC_FINISHED };
    }

    try {
      toBlock = Math.min(toBlock, startBlockHeight - 1);
      fromBlock = Math.max(fromBlock, 0);
      if (fromBlock > toBlock) {
        return baseData;
      }

      doLog(`EVM CDE funnel presync ${this.config.chainId}: #${fromBlock}-${toBlock}`);

      const dynamicDatums = await fetchDynamicPrimitives(
        fromBlock,
        toBlock,
        this.web3,
        this.sharedData,
        this.chainName
      );

      const ungroupedCdeData = (
        await getUngroupedCdeData(
          this.web3,
          this.sharedData.extensions.filter(
            extension =>
              extension.network === this.chainName &&
              extension.cdeType !== ChainDataExtensionType.DynamicPrimitive
          ),
          fromBlock,
          toBlock,
          this.chainName
        )
      ).concat(dynamicDatums);

      return {
        ...baseData,
        [this.chainName]: groupCdeData(this.chainName, fromBlock, toBlock, ungroupedCdeData),
      };
    } catch (err) {
      doLog(`[paima-funnel::readPresyncData] Exception occurred while reading blocks: ${err}`);
      throw err;
    }
  }

  public static async recoverState(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    baseFunnel: ChainFunnel,
    chainName: string,
    config: OtherEvmConfig,
    startingBlockHeight: number
  ): Promise<ParallelEvmFunnel> {
    const web3 = await initWeb3(config.chainUri);

    const latestBlock: number = await timeout(web3.eth.getBlockNumber(), GET_BLOCK_NUMBER_TIMEOUT);
    const cacheEntry = ((): RpcCacheEntry => {
      const entry = sharedData.cacheManager.cacheEntries[RpcCacheEntry.SYMBOL];
      if (entry != null) return entry;

      const newEntry = new RpcCacheEntry();
      sharedData.cacheManager.cacheEntries[RpcCacheEntry.SYMBOL] = newEntry;
      return newEntry;
    })();

    cacheEntry.updateState(config.chainId, latestBlock - (config.confirmationDepth ?? 0));

    const evmCacheEntry = ((): EvmFunnelCacheEntry => {
      const entry = sharedData.cacheManager.cacheEntries[EvmFunnelCacheEntry.SYMBOL];
      if (entry != null) return entry;

      const newEntry = new EvmFunnelCacheEntry();

      sharedData.cacheManager.cacheEntries[EvmFunnelCacheEntry.SYMBOL] = newEntry;
      return newEntry;
    })();

    if (evmCacheEntry.getState(config.chainId).state !== RpcRequestState.HasResult) {
      const startingBlock = await sharedData.web3.eth.getBlock(startingBlockHeight);
      const mappedStartingBlockHeight = await findBlockByTimestamp(
        web3,
        applyDelay(config, Number(startingBlock.timestamp)),
        chainName
      );

      evmCacheEntry.updateState(config.chainId, [], [], mappedStartingBlockHeight);
    }

    return new ParallelEvmFunnel(sharedData, dbTx, config, chainName, baseFunnel, web3);
  }

  // this is the latestBlock of the chain synced by this funnel
  private latestBlock(): number {
    const latestBlockQueryState = this.sharedData.cacheManager.cacheEntries[
      RpcCacheEntry.SYMBOL
    ]?.getState(this.config.chainId);

    if (latestBlockQueryState?.state !== RpcRequestState.HasResult) {
      throw new Error(`[funnel] latest block cache entry not found`);
    }
    return latestBlockQueryState.result;
  }

  private async updateLatestBlock(): Promise<number> {
    const newLatestBlock: number = await timeout(
      this.web3.eth.getBlockNumber(),
      GET_BLOCK_NUMBER_TIMEOUT
    );

    const delayedBlock = newLatestBlock - Math.max(this.config.confirmationDepth ?? 0, 0);

    this.sharedData.cacheManager.cacheEntries[RpcCacheEntry.SYMBOL]?.updateState(
      this.config.chainId,
      delayedBlock
    );

    return delayedBlock;
  }

  private getState(): EvmFunnelCacheEntryState {
    const bufferedState = this.sharedData.cacheManager.cacheEntries[
      EvmFunnelCacheEntry.SYMBOL
    ]?.getState(this.config.chainId);

    if (bufferedState?.state !== RpcRequestState.HasResult) {
      throw new Error(`[funnel] evm funnel state not initialized`);
    }

    return bufferedState.result;
  }
}

export async function wrapToParallelEvmFunnel(
  chainFunnel: ChainFunnel,
  sharedData: FunnelSharedData,
  dbTx: PoolClient,
  startingBlockHeight: number,
  chainName: string,
  config: OtherEvmConfig
): Promise<ChainFunnel> {
  try {
    const ebp = await ParallelEvmFunnel.recoverState(
      sharedData,
      dbTx,
      chainFunnel,
      chainName,
      config,
      startingBlockHeight
    );
    return ebp;
  } catch (err) {
    doLog('[paima-funnel] Unable to initialize evm cde events processor:');
    logError(err);
    throw new Error('[paima-funnel] Unable to initialize evm cde events processor');
  }
}

/**
 * performs binary search to find the block corresponding to a specific timestamp
 * Note: if there are multiple blocks with the same timestamp
 * @returns the index of the first block that occurs > targetTimestamp
 */
async function findBlockByTimestamp(
  web3: Web3,
  targetTimestamp: number,
  chainName: string
): Promise<number> {
  let low = 0;
  // blocks are 0-indexed, so we add +1 to get the size
  let high = Number(await web3.eth.getBlockNumber()) + 1;

  let requests = 0;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);

    const block = await web3.eth.getBlock(mid);

    requests++;

    // recall: there may be many blocks with the same targetTimestamp
    // in this case, <= means we slowly increase `low` to return the most recent block with that timestamp
    if (Number(block.timestamp) <= targetTimestamp) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  doLog(
    `EVM CDE funnel: Found block #${low} on ${chainName} by binary search with ${requests} requests`
  );

  return low;
}

// finds the last block in the timestampToBlockNumber collection that is between
// the range: (-Infinity, maxTimestamp]
// PRE: timestampToBlockNumber should be sorted by timestamp (first element of the tuple)
function getUpperBoundBlock(
  timestampToBlockNumber: [number, number][],
  maxTimestamp: number
): number | undefined {
  let toBlock: number | undefined = undefined;

  for (let i = timestampToBlockNumber.length - 1; i >= 0; i--) {
    const [ts, toBlockInner] = timestampToBlockNumber[i];

    if (maxTimestamp >= ts) {
      toBlock = toBlockInner;
      // we are going backwards, so we can stop
      break;
    }
  }

  return toBlock;
}
