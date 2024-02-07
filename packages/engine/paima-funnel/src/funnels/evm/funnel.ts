import { ENV, EvmConfig, doLog, initWeb3, logError, timeout, Web3, delay } from '@paima/utils';
import type { ChainFunnel, ReadPresyncDataFrom } from '@paima/runtime';
import type { ChainData, PresyncChainData } from '@paima/sm';
import { getUngroupedCdeData } from '../../cde/reading.js';
import { composeChainData, groupCdeData } from '../../utils.js';
import { BaseFunnel } from '../BaseFunnel.js';
import type { FunnelSharedData } from '../BaseFunnel.js';
import { EvmFunnelCacheEntry, RpcCacheEntry, RpcRequestState } from '../FunnelCache.js';
import type { PoolClient } from 'pg';
import { FUNNEL_PRESYNC_FINISHED } from '@paima/utils';
import { ConfigNetworkType } from '@paima/utils/src/config/loading.js';
import { getMultipleBlockData } from '../../reading.js';

const GET_BLOCK_NUMBER_TIMEOUT = 5000;

// INVARIANT:
export class EvmFunnel extends BaseFunnel implements ChainFunnel {
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

    // the blocks that are not below the filtered are kept in the cache
    // TODO: is it fine to do this here, or should it happen at the end?
    chainData.forEach(_ => cachedState.bufferedChainData.shift());

    if (chainData.length === 0) {
      return chainData;
    }

    if (!cachedState.lastBlock) {
      const block = await this.sharedData.web3.eth.getBlock(chainData[0].blockNumber - 1);

      const ts = Number(block.timestamp);
      cachedState.lastBlock = await findBlockByTimestamp(this.web3, ts);
    }

    const minTimestamp = Math.min(...chainData.map(data => data.timestamp));
    const maxTimestamp = Math.max(...chainData.map(data => data.timestamp));

    const blocks = [];

    while (true) {
      const latestBlock = this.latestBlock();

      // we need to fetch the blocks in order to know the timestamps, so that we
      // can make a mapping from the trunk chain to the parallel chain.
      const parallelEvmBlocks = await getMultipleBlockData(
        this.web3,
        cachedState.lastBlock + 1,
        Math.min(latestBlock, cachedState.lastBlock + 1 + ENV.DEFAULT_FUNNEL_GROUP_SIZE),
        this.chainName
      );

      blocks.push(...parallelEvmBlocks);

      if (blocks.length > 0 && blocks[blocks.length - 1].timestamp >= maxTimestamp) {
        break;
      }

      while ((await this.updateLatestBlock()) === latestBlock) {
        // wait for blocks to be produced
        await delay(500);
      }

      // potentially we didn't fetch enough blocks in a single request in that
      // case we get more blocks we loop again
    }

    // After we get the blocks from the parallel evm chain, we need to join them
    // with the trunk. We need to then assign back the blocks from the side
    // chain to the main chain.
    const inverseMapping: { [blockNumber: number]: number } = {};

    // chainData is sorted by timestamp, so we never need to search old entries,
    // we keep this around to know from where to start searching for a block
    // from the original chain that has a timestamp >= than the current
    // sidechain block
    let currIndex = 0;

    for (const block of blocks) {
      cachedState.timestampToBlockNumber.push([block.timestamp, block.blockNumber]);

      while (currIndex < chainData.length) {
        if (chainData[currIndex].timestamp >= block.timestamp) {
          inverseMapping[block.blockNumber] = chainData[currIndex].blockNumber;
          break;
        } else {
          currIndex++;
        }
      }

      cachedState.lastBlock = block.blockNumber;
    }

    while (true) {
      if (cachedState.timestampToBlockNumber.length === 0) {
        return chainData;
      }

      if (cachedState.timestampToBlockNumber[0][0] < minTimestamp) {
        cachedState.timestampToBlockNumber.shift();
      } else {
        break;
      }
    }

    if (!cachedState.timestampToBlockNumber[0]) {
      return chainData;
    }

    const fromBlock = cachedState.timestampToBlockNumber[0][1];

    let toBlock = getToBlock(cachedState.timestampToBlockNumber, maxTimestamp) || fromBlock;

    if (!toBlock || fromBlock < 0 || toBlock < fromBlock) {
      return chainData;
    }

    if (toBlock === fromBlock) {
      doLog(`EVM CDE funnel ${this.config.chainId}: #${toBlock}`);
      return await this.internalReadDataSingle(fromBlock, chainData[0]);
    } else {
      doLog(`EVM CDE funnel ${this.config.chainId}: #${fromBlock}-${toBlock}`);
      return await this.internalReadDataMulti(
        fromBlock,
        toBlock,
        chainData,
        blockNumber => inverseMapping[blockNumber]
      );
    }
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
        this.sharedData.extensions.filter(extension => extension.network === this.chainName),
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

      const cdeData = groupCdeData(
        this.chainName,
        ConfigNetworkType.EVM_OTHER,
        fromBlock,
        toBlock,
        ungroupedCdeData
      );

      for (const data of cdeData) {
        data.blockNumber = sidechainToMainchainNumber(data.blockNumber);
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

    if (fromBlock >= this.getState().startBlockHeight) {
      return { ...baseData, [this.chainName]: FUNNEL_PRESYNC_FINISHED };
    }

    try {
      toBlock = Math.min(toBlock, this.getState().startBlockHeight);
      fromBlock = Math.max(fromBlock, 0);
      if (fromBlock > toBlock) {
        return baseData;
      }

      const ungroupedCdeData = await getUngroupedCdeData(
        this.web3,
        this.sharedData.extensions.filter(extension => extension.network === this.chainName),
        fromBlock,
        toBlock
      );
      return {
        ...baseData,
        [this.chainName]: groupCdeData(
          this.chainName,
          ConfigNetworkType.EVM_OTHER,
          fromBlock,
          toBlock,
          ungroupedCdeData
        ),
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
  ): Promise<EvmFunnel> {
    const web3 = await initWeb3(config.chainUri);
    // we always write to this cache instead of reading from it
    // as other funnels used may want to read from this cached data

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
        Number(startingBlock.timestamp)
      );

      evmCacheEntry.updateState(config.chainId, [], [], mappedStartingBlockHeight);
    }

    return new EvmFunnel(sharedData, dbTx, config, chainName, baseFunnel, web3);
  }

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
    const newLatestBlock = await this.web3.eth.getBlockNumber();

    this.sharedData.cacheManager.cacheEntries[RpcCacheEntry.SYMBOL]?.updateState(
      this.config.chainId,
      newLatestBlock
    );

    return newLatestBlock;
  }

  private getState(): {
    bufferedChainData: ChainData[];
    timestampToBlockNumber: [number, number][];
    lastBlock: number | undefined;
    startBlockHeight: number;
  } {
    const bufferedState = this.sharedData.cacheManager.cacheEntries[
      EvmFunnelCacheEntry.SYMBOL
    ]?.getState(this.config.chainId);

    if (bufferedState?.state !== RpcRequestState.HasResult) {
      throw new Error(`[funnel] evm funnel state not initialized`);
    }

    return bufferedState.result;
  }
}

export async function wrapToEvmFunnel(
  chainFunnel: ChainFunnel,
  sharedData: FunnelSharedData,
  dbTx: PoolClient,
  startingBlockHeight: number,
  chainName: string,
  config: EvmConfig
): Promise<ChainFunnel> {
  try {
    const ebp = await EvmFunnel.recoverState(
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

async function findBlockByTimestamp(web3: Web3, timestamp: number): Promise<number> {
  let low = 0;
  let high = Number(await web3.eth.getBlockNumber()) + 1;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);

    const block = await web3.eth.getBlock(mid);

    if (Number(block.timestamp) < timestamp) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

function getToBlock(
  timestampToBlockNumber: [number, number][],
  maxTimestamp: number
): number | undefined {
  let toBlock: number | undefined = undefined;

  for (let i = timestampToBlockNumber.length; i > 0; i--) {
    const [ts, toBlockInner] = timestampToBlockNumber[i - 1];

    if (maxTimestamp <= ts) {
      toBlock = toBlockInner;
    }
  }

  return toBlock;
}
