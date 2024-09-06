import type { AvailConfig } from '@paima/utils';
import type { SubmittedData } from '@paima/chain-types';
import { doLog, logError, delay, InternalEventType, timeout, caip2PrefixFor } from '@paima/utils';
import type {
  ChainFunnel,
  FunnelJson,
  ReadPresyncDataFrom,
} from 'packages/node-sdk/paima-runtime/build/index.js';
import { type ChainData, type PresyncChainData } from '@paima/sm';
import { BaseFunnel } from '../BaseFunnel.js';
import type { FunnelSharedData } from '../BaseFunnel.js';
import type { PoolClient } from 'pg';
import { FUNNEL_PRESYNC_FINISHED } from '@paima/utils';
import { createApi } from './createApi.js';
import { getLatestProcessedCdeBlockheight } from '@paima/db';
import type { Header } from './utils.js';
import {
  getDAData,
  getLatestBlockNumber,
  getMultipleHeaderData,
  getSlotFromHeader,
  getTimestampForBlockAt,
  slotToTimestamp,
  timestampToSlot,
  GET_DATA_TIMEOUT,
  getLatestAvailableBlockNumberFromLightClient,
} from './utils.js';
import {
  addInternalCheckpointingEvent,
  buildParallelBlockMappings,
  composeChainData,
  findBlockByTimestamp,
  getUpperBoundBlock,
} from '../../utils.js';
import type { ChainInfo } from '../../utils.js';
import { processDataUnit } from '../../paima-l2-processing.js';
import type { ApiPromise } from 'avail-js-sdk';
import type { AvailFunnelCacheEntryState } from './cache.js';
import { AvailFunnelCacheEntry } from './cache.js';

const LATEST_BLOCK_UPDATE_TIMEOUT = 2000;

type BlockData = {
  blockNumber: number;
  timestamp: number;
  submittedData: SubmittedData[];
  hash: string;
  slot: number;
};

function applyDelay(config: AvailConfig, baseTimestamp: number): number {
  return Math.max(baseTimestamp - (config.delay ?? 0), 0);
}

export class AvailParallelFunnel extends BaseFunnel implements ChainFunnel {
  chainInfo: ChainInfo<AvailConfig>;

  protected constructor(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    chainInfo: ChainInfo<AvailConfig>,
    private readonly baseFunnel: ChainFunnel,
    private readonly api: ApiPromise
  ) {
    super(sharedData, dbTx);
    this.readData.bind(this);
    this.readPresyncData.bind(this);
    this.getDbTx.bind(this);
    this.configPrint.bind(this);
    this.chainInfo = chainInfo;
  }

  public override async readData(blockHeight: number): Promise<ChainData[]> {
    const cachedState = this.getState();

    const caip2 = caip2PrefixFor(this.chainInfo.config);

    const chainData: ChainData[] = await readFromWrappedFunnel(
      blockHeight,
      this.baseFunnel,
      cachedState.bufferedChainData,
      async () => {
        await this.updateLatestBlock();
        const latestBlockQueryState = this.latestBlock();
        const latestHeaderTimestamp = slotToTimestamp(latestBlockQueryState.slot, this.api);

        return latestHeaderTimestamp;
      },
      (ts: number) => applyDelay(this.chainInfo.config, ts)
    );

    if (chainData.length === 0) {
      return chainData;
    }

    if (!cachedState.lastBlock) {
      await restoreLastPointCheckpointFromDb(
        this.getCacheEntry(),
        this.dbTx,
        caip2PrefixFor(this.chainInfo.config),
        cachedState.startingBlockHeight
      );
    }

    const maxSlot = timestampToSlot(
      applyDelay(this.chainInfo.config, chainData[chainData.length - 1].timestamp),
      this.api
    );

    const parallelData: BlockData[] = [];

    while (true) {
      const latestBlock = this.latestBlock();
      const to = Math.min(
        latestBlock.number,
        cachedState.lastBlock + this.chainInfo.config.funnelBlockGroupSize
      );

      doLog(`Avail funnel #${cachedState.lastBlock + 1}-${to}`);

      const roundParallelData = await timeout(
        getDAData(
          this.api,
          this.chainInfo.config.lightClient,
          cachedState.lastBlock + 1,
          to,
          caip2
        ),
        GET_DATA_TIMEOUT
      );

      let parallelHeaders;

      if (roundParallelData.length > 0) {
        const numbers = roundParallelData.map(d => d.blockNumber);

        // we only need at least one to have some idea of where we are in time.
        // otherwise if there is no data submitted for the app we would never
        // exit this loop.
        if (numbers[numbers.length - 1] !== to) {
          numbers.push(to);
        }

        // get only headers for block that have data
        parallelHeaders = await timeout(getMultipleHeaderData(this.api, numbers), GET_DATA_TIMEOUT);
      } else {
        // unless the range is empty
        parallelHeaders = await timeout(getMultipleHeaderData(this.api, [to]), GET_DATA_TIMEOUT);
      }

      for (const blockData of roundParallelData) {
        const header = parallelHeaders.find(h => h.number === blockData.blockNumber);

        if (!header) {
          throw new Error("Couldn't get header for block with app data");
        }

        const blockTimestamp = slotToTimestamp(header.slot, this.api);

        const mapped = [];

        const processed = await Promise.all(
          blockData.submittedData.map(unit =>
            processDataUnit(unit, blockData.blockNumber, blockTimestamp, this.dbTx)
          )
        );

        for (const data of processed) {
          mapped.push(...data);
        }

        parallelData.push({
          blockNumber: blockData.blockNumber,
          timestamp: blockTimestamp,
          slot: header.slot,
          hash: header.hash,
          submittedData: mapped,
        });
      }

      if (parallelHeaders.length > 0) {
        const last = parallelHeaders[parallelHeaders.length - 1];

        this.getCacheEntry().updateLastBlock(last.number);
      }

      if (
        parallelHeaders.length > 0 &&
        parallelHeaders[parallelHeaders.length - 1].slot >= maxSlot
      ) {
        break;
      }

      if (to !== latestBlock.number) continue;
      await this.waitForBlocksToBeProduced(latestBlock.number);
    }

    const cacheEntry = this.getCacheEntry();

    cacheEntry.cacheBlocks(parallelData);
    cacheEntry.cleanOldEntries(slotToTimestamp(cachedState.lastMaxSlot, this.api));

    if (cachedState.timestampToBlock.length === 0) {
      return chainData;
    }

    cacheEntry.updateLastMaxSlot(maxSlot);

    const { parallelToMainchainBlockHeightMapping, mainchainToParallelBlockHeightMapping } =
      buildParallelBlockMappings(
        (ts: number) => applyDelay(this.chainInfo.config, ts),
        chainData,
        cachedState.timestampToBlock
      );

    if (cachedState.timestampToBlock[0][0] > slotToTimestamp(maxSlot, this.api)) {
      return chainData;
    }

    let toBlock = getUpperBoundBlock(
      cachedState.timestampToBlock.map(d => [d[0], d[1].blockNumber]),
      slotToTimestamp(maxSlot, this.api)
    );

    if (!toBlock) {
      return chainData;
    }

    const parallelDataInRange = cachedState.timestampToBlock
      .map(d => d[1])
      .filter(d => d.blockNumber <= toBlock);

    mapBlockNumbersToMainChain(parallelDataInRange, parallelToMainchainBlockHeightMapping);

    composeChainData(chainData, parallelDataInRange);

    addInternalCheckpointingEvent(
      chainData,
      n => mainchainToParallelBlockHeightMapping[n],
      caip2,
      InternalEventType.AvailLastBlock
    );

    return chainData;
  }

  private async waitForBlocksToBeProduced(latestKnownBlock: number): Promise<void> {
    while ((await this.updateLatestBlock()) === latestKnownBlock) {
      await delay(500);
    }
  }

  public override async readPresyncData(
    args: ReadPresyncDataFrom
  ): Promise<{ [caip2: string]: PresyncChainData[] | typeof FUNNEL_PRESYNC_FINISHED }> {
    const baseDataPromise = this.baseFunnel.readPresyncData(args);

    const caip2 = caip2PrefixFor(this.chainInfo.config);
    let arg = args.find(arg => arg.caip2 == caip2);

    if (!arg) {
      return await baseDataPromise;
    } else {
      return { ...(await baseDataPromise), [caip2]: FUNNEL_PRESYNC_FINISHED };
    }
  }

  public static async recoverState(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    baseFunnel: ChainFunnel,
    chainInfo: ChainInfo<AvailConfig>
  ): Promise<AvailParallelFunnel> {
    const availFunnelCacheEntry = ((): AvailFunnelCacheEntry => {
      const entry = sharedData.cacheManager.cacheEntries[AvailFunnelCacheEntry.SYMBOL];
      if (entry != null) return entry;

      const newEntry = new AvailFunnelCacheEntry();

      sharedData.cacheManager.cacheEntries[AvailFunnelCacheEntry.SYMBOL] = newEntry;
      return newEntry;
    })();

    const api = await createApi(chainInfo.config.rpc);

    if (!availFunnelCacheEntry.initialized()) {
      const startingBlock = await sharedData.mainNetworkApi.getStartingBlock();

      if (!startingBlock) {
        throw new Error("Couldn't get base funnel starting block timestamp");
      }

      const mappedStartingBlockHeight = await findBlockByTimestamp(
        // the genesis doesn't have a slot to extract a timestamp from
        1,
        await getLatestBlockNumber(api),
        applyDelay(chainInfo.config, Number(startingBlock.timestamp)),
        chainInfo.name,
        async (blockNumber: number) => await getTimestampForBlockAt(api, blockNumber)
      );

      availFunnelCacheEntry.initialize(mappedStartingBlockHeight);
    }

    const funnel = new AvailParallelFunnel(sharedData, dbTx, chainInfo, baseFunnel, api);

    await funnel.updateLatestBlock();

    return funnel;
  }

  private latestBlock(): { hash: string; number: number; slot: number } {
    const latestBlockQueryState =
      this.sharedData.cacheManager.cacheEntries[AvailFunnelCacheEntry.SYMBOL]?.getState();

    if (
      latestBlockQueryState?.latestBlock === undefined ||
      latestBlockQueryState.latestBlock === null
    ) {
      throw new Error('Latest block cache entry not initialized');
    }

    return latestBlockQueryState.latestBlock;
  }

  private async updateLatestBlock(): Promise<number> {
    const config = this.chainInfo.config;

    const latestHeader = await timeout(
      (async (): Promise<Header> => {
        const latestNumber = await getLatestAvailableBlockNumberFromLightClient(config.lightClient);

        const latestBlockHash = await this.api.rpc.chain.getBlockHash(latestNumber);
        const latestHeader = await this.api.rpc.chain.getHeader(latestBlockHash);

        return latestHeader as unknown as Header;
      })(),
      LATEST_BLOCK_UPDATE_TIMEOUT
    );

    const slot = getSlotFromHeader(latestHeader, this.api);

    this.sharedData.cacheManager.cacheEntries[AvailFunnelCacheEntry.SYMBOL]?.updateLatestBlock({
      number: latestHeader.number.toNumber(),
      hash: latestHeader.hash.toString(),
      slot: slot,
    });

    return latestHeader.number.toNumber();
  }

  private getCacheEntry(): AvailFunnelCacheEntry {
    const cacheEntry = this.sharedData.cacheManager.cacheEntries[AvailFunnelCacheEntry.SYMBOL];

    return cacheEntry!;
  }

  private getState(): Readonly<AvailFunnelCacheEntryState> {
    const bufferedState =
      this.sharedData.cacheManager.cacheEntries[AvailFunnelCacheEntry.SYMBOL]?.getState();

    if (bufferedState === null || bufferedState === undefined) {
      throw new Error(`[funnel] avail funnel state not initialized`);
    }

    return bufferedState;
  }

  public override configPrint(): FunnelJson {
    return {
      type: 'AvailParallelFunnel',
      chainName: this.chainInfo.name,
      child: this.baseFunnel.configPrint(),
    };
  }
}

function mapBlockNumbersToMainChain(
  parallelData: BlockData[],
  parallelToMainchainBlockHeightMapping: { [blockNumber: number]: number }
): void {
  for (const data of parallelData) {
    data.blockNumber = parallelToMainchainBlockHeightMapping[data.blockNumber];
  }
}

// Gets the latest processed block in a particular chain. Used to restore the
// synchronization point after a restart.
async function restoreLastPointCheckpointFromDb(
  cacheEntry: AvailFunnelCacheEntry,
  dbTx: PoolClient,
  caip2: string,
  startingBlockHeight: number
): Promise<void> {
  const queryResults = await getLatestProcessedCdeBlockheight.run({ caip2 }, dbTx);

  if (queryResults[0]) {
    // If we are in `readData`, we know that the presync stage finished.
    // This means `readPresyncData` was actually called with the entire
    // range up to startBlockHeight - 1 (inclusive), since that's the stop
    // condition for the presync. So there is no point in starting from
    // earlier than that, since we know there are no events there.

    cacheEntry.updateLastBlock(Math.max(queryResults[0].block_height, startingBlockHeight - 1));
  }
}

export async function wrapToAvailParallelFunnel(
  chainFunnel: ChainFunnel,
  sharedData: FunnelSharedData,
  dbTx: PoolClient,
  chainInfo: ChainInfo<AvailConfig>
): Promise<ChainFunnel> {
  try {
    const ebp = await AvailParallelFunnel.recoverState(sharedData, dbTx, chainFunnel, chainInfo);
    return ebp;
  } catch (err) {
    doLog('[paima-funnel] Unable to initialize avail events processor:');
    logError(err);
    throw new Error('[paima-funnel] Unable to initialize avail events processor');
  }
}

async function readFromWrappedFunnel(
  blockHeight: number,
  baseFunnel: ChainFunnel,
  bufferedChainData: ChainData[],
  getLatestBlockTimestamp: () => Promise<number>,
  applyDelay: (ts: number) => number
): Promise<ChainData[]> {
  // if in the previous round we couldn't return some blocks because the
  // parallel chain didn't get far enough, we first process those.
  if (bufferedChainData.length === 0) {
    const baseData = await baseFunnel.readData(blockHeight);
    bufferedChainData.push(...baseData);
  }

  const latestHeaderTimestamp = await getLatestBlockTimestamp();

  const chainData: ChainData[] = [];

  // filter the data so that we are sure we can get all the blocks in the range
  for (const data of bufferedChainData) {
    if (applyDelay(data.timestamp) <= latestHeaderTimestamp) {
      chainData.push(data);
    }
  }

  // the blocks that didn't pass the filter are kept in the cache, so that
  // the block funnel doesn't get them again.
  chainData.forEach(_ => bufferedChainData.shift());

  return chainData;
}
