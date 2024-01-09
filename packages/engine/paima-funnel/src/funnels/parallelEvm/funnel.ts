import {
  ENV,
  EvmConfig,
  doLog,
  initWeb3,
  logError,
  timeout,
  Web3,
  delay,
  InternalEventType,
} from '@paima/utils';
import type { ChainFunnel, ReadPresyncDataFrom } from '@paima/runtime';
import type { ChainData, EvmPresyncChainData, PresyncChainData } from '@paima/sm';
import { getUngroupedCdeData } from '../../cde/reading.js';
import { composeChainData, groupCdeData } from '../../utils.js';
import { BaseFunnel } from '../BaseFunnel.js';
import type { FunnelSharedData } from '../BaseFunnel.js';
import {
  EvmFunnelCacheEntry,
  EvmFunnelCacheEntryState,
  RpcCacheEntry,
  RpcRequestState,
} from '../FunnelCache.js';
import type { PoolClient } from 'pg';
import { FUNNEL_PRESYNC_FINISHED, ConfigNetworkType } from '@paima/utils';
import { getMultipleBlockData } from '../../reading.js';
import { getLatestProcessedCdeBlockheight } from '@paima/db';

const GET_BLOCK_NUMBER_TIMEOUT = 5000;

export class ParallelEvmFunnel extends BaseFunnel implements ChainFunnel {
  config: EvmConfig;
  chainName: string;

  protected constructor(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    config: EvmConfig,
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
      if (data.timestamp <= Number(latestBlock.timestamp)) {
        chainData.push(data);
      }
    }

    // the blocks that didn't pass the the filter are kept in the cache, so that
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
        cachedState.lastBlock = queryResults[0].block_height;
      } else {
        const block = await this.sharedData.web3.eth.getBlock(chainData[0].blockNumber - 1);

        const ts = Number(block.timestamp);
        cachedState.lastBlock = (await findBlockByTimestamp(this.web3, ts, this.chainName)) - 1;
      }
    }

    const maxTimestamp = chainData[chainData.length - 1].timestamp;

    const blocks = [];

    while (true) {
      const latestBlock = this.latestBlock();

      // we need to fetch the blocks in order to know the timestamps, so that we
      // can make a mapping from the trunk chain to the parallel chain.
      const parallelEvmBlocks = await getMultipleBlockData(
        this.web3,
        cachedState.lastBlock + 1,
        Math.min(latestBlock, cachedState.lastBlock + this.config.funnelBlockGroupSize),
        this.chainName
      );

      blocks.push(...parallelEvmBlocks);

      // this has to be > instead of >= because apparently there can be multiple
      // blocks with the same timestamp (e.g. arbitrum)
      if (blocks.length > 0 && blocks[blocks.length - 1].timestamp > maxTimestamp) {
        break;
      }

      if (blocks.length > 0) {
        cachedState.lastBlock = blocks[blocks.length - 1].blockNumber;
      }

      while ((await this.updateLatestBlock()) === latestBlock) {
        // wait for blocks to be produced
        await delay(500);
      }

      // potentially we didn't fetch enough blocks in a single request in that
      // case we get more blocks we loop again
    }

    // After we get the blocks from the parallel evm chain, we need to join them
    // with the trunk.
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

    for (const parallelChainBlock of blocks) {
      cachedState.timestampToBlockNumber.push([
        parallelChainBlock.timestamp,
        parallelChainBlock.blockNumber,
      ]);

      while (currIndex < chainData.length) {
        if (chainData[currIndex].timestamp >= parallelChainBlock.timestamp) {
          sidechainToMainchainBlockHeightMapping[parallelChainBlock.blockNumber] =
            chainData[currIndex].blockNumber;

          mainchainToSidechainBlockHeightMapping[chainData[currIndex].blockNumber] =
            parallelChainBlock.blockNumber;
          break;
        } else {
          currIndex++;
        }
      }

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

    if (!cachedState.timestampToBlockNumber[0]) {
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
      data = await this.internalReadDataSingle(fromBlock, chainData[0]);
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

      if (!chainData.internalEvents && originalBlockNumber) {
        chainData.internalEvents = [];
      }

      // it's technically possible for this to be null, because there may not be
      // a block of the sidechain in between a particular pair of blocks or the
      // original chain.
      //
      // in this case it could be more optimal to set the block number here to
      // the one in the next block, but it shouldn't make much of a difference.
      if (originalBlockNumber) {
        chainData.internalEvents?.push({
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
    }

    return data;
  }

  private internalReadDataSingle = async (
    blockNumber: number,
    baseChainData: ChainData
  ): Promise<ChainData[]> => {
    if (blockNumber < 0) {
      return [];
    }
    try {
      const cdeData = await getUngroupedCdeData(
        this.web3,
        this.sharedData.extensions.filter(
          extension => !extension.network || extension.network === this.chainName
        ),
        blockNumber,
        blockNumber
      );

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
      const ungroupedCdeData = await getUngroupedCdeData(
        this.web3,
        this.sharedData.extensions.filter(extension => extension.network === this.chainName),
        fromBlock,
        toBlock
      );

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

      const ungroupedCdeData = await getUngroupedCdeData(
        this.web3,
        this.sharedData.extensions.filter(extension => extension.network === this.chainName),
        fromBlock,
        toBlock
      );

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
    config: EvmConfig,
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

    cacheEntry.updateState(config.chainId, latestBlock);

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
        Number(startingBlock.timestamp),
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

    this.sharedData.cacheManager.cacheEntries[RpcCacheEntry.SYMBOL]?.updateState(
      this.config.chainId,
      newLatestBlock
    );

    return newLatestBlock;
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
  config: EvmConfig
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

// performs binary search to find the corresponding block
async function findBlockByTimestamp(
  web3: Web3,
  timestamp: number,
  chainName: string
): Promise<number> {
  let low = 0;
  let high = Number(await web3.eth.getBlockNumber()) + 1;

  let requests = 0;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);

    const block = await web3.eth.getBlock(mid);

    requests++;

    if (Number(block.timestamp) < timestamp) {
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
