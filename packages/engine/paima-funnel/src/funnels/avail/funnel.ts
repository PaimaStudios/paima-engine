import type { AvailConfig } from '@paima/utils';
import {
  doLog,
  logError,
  delay,
  ChainDataExtensionDatumType,
  ConfigNetworkType,
  InternalEventType,
} from '@paima/utils';
import type { ChainFunnel, ReadPresyncDataFrom } from '@paima/runtime';
import type { CdeGenericDatum, ChainDataExtensionDatum } from '@paima/sm';
import { type ChainData, type PresyncChainData } from '@paima/sm';
import { BaseFunnel } from '../BaseFunnel.js';
import type { FunnelSharedData } from '../BaseFunnel.js';
import type { AvailFunnelCacheEntryState } from '../FunnelCache.js';
import { AvailFunnelCacheEntry } from '../FunnelCache.js';
import type { PoolClient } from 'pg';
import { FUNNEL_PRESYNC_FINISHED } from '@paima/utils';
import { createApi } from './createApi.js';
import { getLatestProcessedCdeBlockheight } from '@paima/db';
import {
  getLatestBlockNumber,
  getMultipleHeaderData,
  getSlotFromHeader,
  getTimestampForBlockAt,
  slotToTimestamp,
  timestampToSlot,
} from './utils.js';
import { buildParallelBlockMappings, findBlockByTimestamp } from '../../utils.js';

type BlockData = {
  number: number;
  timestamp: number;
  extensionDatums: ChainDataExtensionDatum[];
  hash: string;
  slot: number;
};

function applyDelay(config: AvailConfig, baseTimestamp: number): number {
  return Math.max(baseTimestamp - (config.delay ?? 0), 0);
}

export class AvailFunnel extends BaseFunnel implements ChainFunnel {
  config: AvailConfig;
  chainName: string;

  protected constructor(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    config: AvailConfig,
    chainName: string,
    private readonly baseFunnel: ChainFunnel
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

    const chainData: ChainData[] = await readFromBaseFunnel(
      blockHeight,
      this.baseFunnel,
      cachedState.bufferedChainData,
      async () => {
        await this.updateLatestBlock();
        const latestBlockQueryState = this.latestBlock();
        const latestHeaderTimestamp = slotToTimestamp(latestBlockQueryState.slot, cachedState.api);

        return latestHeaderTimestamp;
      },
      (ts: number) => applyDelay(this.config, ts)
    );

    if (chainData.length === 0) {
      return chainData;
    }

    await restoreLastPointCheckpointFromDb(cachedState, this.dbTx, this.chainName);

    const maxSlot = timestampToSlot(
      applyDelay(this.config, chainData[chainData.length - 1].timestamp),
      cachedState.api
    );

    const parallelData: BlockData[] = [];

    while (true) {
      const latestBlock = this.latestBlock();
      const to = Math.min(
        latestBlock.number,
        cachedState.lastBlock + this.config.funnelBlockGroupSize
      );

      doLog(`Avail funnel #${cachedState.lastBlock + 1}-${to}`);

      const roundParallelData = await getDAData(
        this.config.lightClient,
        cachedState.lastBlock + 1,
        to,
        this.chainName
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
        parallelHeaders = await getMultipleHeaderData(cachedState.api, numbers);
      } else {
        // unless the range is empty
        parallelHeaders = await getMultipleHeaderData(cachedState.api, [to]);
      }

      for (const blockData of roundParallelData) {
        const header = parallelHeaders.find(h => h.number === blockData.blockNumber);

        if (!header) {
          throw new Error("Couldn't get header for block with app data");
        }

        parallelData.push({
          number: blockData.blockNumber,
          timestamp: slotToTimestamp(header.slot, cachedState.api),
          slot: header.slot,
          hash: header.hash,
          extensionDatums: blockData.extensionDatums,
        });
      }

      if (parallelHeaders.length > 0) {
        const last = parallelHeaders[parallelHeaders.length - 1];

        cachedState.lastBlock = last.number;
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

    for (const availBlock of parallelData) {
      cachedState.timestampToBlock.push([
        availBlock.timestamp,
        { blockNumber: availBlock.number, extensionDatums: availBlock.extensionDatums },
      ]);

      cachedState.latestBlock = {
        hash: availBlock.hash,
        number: availBlock.number,
        slot: availBlock.slot,
      };
    }

    removeOldEntriesFromPreviousRound(cachedState);

    if (cachedState.timestampToBlock.length === 0) {
      return chainData;
    }

    cachedState.lastMaxSlot = maxSlot;

    const { parallelToMainchainBlockHeightMapping, mainchainToParallelBlockHeightMapping } =
      buildParallelBlockMappings(
        (ts: number) => applyDelay(this.config, ts),
        chainData,
        cachedState.timestampToBlock
      );

    if (!cachedState.timestampToBlock[0]) {
      return chainData;
    }

    if (cachedState.timestampToBlock[0][0] > slotToTimestamp(maxSlot, cachedState.api)) {
      return chainData;
    }

    let toBlock = getUpperBoundBlock(
      cachedState.timestampToBlock.map(d => [d[0], d[1].blockNumber]),
      slotToTimestamp(maxSlot, cachedState.api)
    );

    if (!toBlock) {
      return chainData;
    }

    const parallelDataInRange = parallelData.filter(d => d.number <= toBlock);

    mapBlockNumbersToMainChain(parallelDataInRange, parallelToMainchainBlockHeightMapping);

    composeChainData(chainData, parallelDataInRange);

    addInternalCheckpointingEvent(
      chainData,
      n => mainchainToParallelBlockHeightMapping[n],
      this.chainName,
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
  ): Promise<{ [network: string]: PresyncChainData[] | typeof FUNNEL_PRESYNC_FINISHED }> {
    const baseDataPromise = this.baseFunnel.readPresyncData(args);

    let arg = args.find(arg => arg.network == this.chainName);

    const startingBlockHeight = this.getState().startingBlockHeight;
    const chainName = this.chainName;
    const lightClient = this.config.lightClient;

    if (!arg) {
      return await baseDataPromise;
    }

    let fromBlock = arg.from;
    let toBlock = arg.to;

    if (fromBlock >= startingBlockHeight) {
      return { ...(await baseDataPromise), [chainName]: FUNNEL_PRESYNC_FINISHED };
    }

    const [baseData, data] = await Promise.all([
      baseDataPromise,
      (async function (): Promise<{ blockNumber: number; extensionDatums: CdeGenericDatum[] }[]> {
        try {
          toBlock = Math.min(toBlock, startingBlockHeight - 1);
          fromBlock = Math.max(fromBlock, 0);
          if (fromBlock > toBlock) {
            return [];
          }

          doLog(`Avail funnel presync ${chainName}: #${fromBlock}-${toBlock}`);

          const data = await getDAData(lightClient, fromBlock, toBlock, chainName);

          return data;
        } catch (err) {
          doLog(`[paima-funnel::readPresyncData] Exception occurred while reading blocks: ${err}`);
          throw err;
        }
      })(),
    ]);

    return {
      ...baseData,
      [this.chainName]: data.map(d => ({
        extensionDatums: d.extensionDatums,
        networkType: ConfigNetworkType.AVAIL,
        network: this.chainName,
        blockNumber: d.blockNumber,
      })),
    };
  }

  public static async recoverState(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    baseFunnel: ChainFunnel,
    chainName: string,
    config: AvailConfig,
    startingBlockHeight: number
  ): Promise<AvailFunnel> {
    const availFunnelCacheEntry = ((): AvailFunnelCacheEntry => {
      const entry = sharedData.cacheManager.cacheEntries[AvailFunnelCacheEntry.SYMBOL];
      if (entry != null) return entry;

      const newEntry = new AvailFunnelCacheEntry();

      sharedData.cacheManager.cacheEntries[AvailFunnelCacheEntry.SYMBOL] = newEntry;
      return newEntry;
    })();

    if (!availFunnelCacheEntry.initialized()) {
      const startingBlock = await sharedData.web3.eth.getBlock(startingBlockHeight);

      const api = await createApi(config.rpc);

      const mappedStartingBlockHeight = await findBlockByTimestamp(
        // the genesis doesn't have a slot to extract a timestamp from
        1,
        await getLatestBlockNumber(api),
        applyDelay(config, Number(startingBlock.timestamp)),
        chainName,
        async (blockNumber: number) => await getTimestampForBlockAt(api, blockNumber)
      );

      availFunnelCacheEntry.initialize(api, mappedStartingBlockHeight);
    }

    const funnel = new AvailFunnel(sharedData, dbTx, config, chainName, baseFunnel);

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
    const cachedState = this.getState();
    // TODO: timeout
    const latestHead = await cachedState.api.rpc.chain.getFinalizedHead();
    const latestHeader = await cachedState.api.rpc.chain.getHeader(latestHead);

    const delayedBlock = Math.max(
      latestHeader.number.toNumber() - (this.config.confirmationDepth ?? 0),
      1
    );

    const delayedBlockHash = await cachedState.api.rpc.chain.getBlockHash(delayedBlock);
    const delayedHeader = await cachedState.api.rpc.chain.getHeader(delayedBlockHash);

    const slot = getSlotFromHeader(delayedHeader, cachedState.api);

    this.sharedData.cacheManager.cacheEntries[AvailFunnelCacheEntry.SYMBOL]?.updateLatestBlock({
      number: delayedHeader.number.toNumber(),
      hash: delayedBlockHash.toString(),
      slot: slot,
    });

    return delayedBlock;
  }

  private getState(): AvailFunnelCacheEntryState {
    const bufferedState =
      this.sharedData.cacheManager.cacheEntries[AvailFunnelCacheEntry.SYMBOL]?.getState();

    if (bufferedState === null || bufferedState === undefined) {
      throw new Error(`[funnel] avail funnel state not initialized`);
    }

    return bufferedState;
  }
}

function removeOldEntriesFromPreviousRound(cachedState: AvailFunnelCacheEntryState): void {
  while (true) {
    if (
      cachedState.timestampToBlock.length > 0 &&
      cachedState.timestampToBlock[0][0] <=
        slotToTimestamp(cachedState.lastMaxSlot, cachedState.api)
    ) {
      cachedState.timestampToBlock.shift();
    } else {
      break;
    }
  }
}

function mapBlockNumbersToMainChain(
  parallelData: BlockData[],
  parallelToMainchainBlockHeightMapping: { [blockNumber: number]: number }
): void {
  for (const data of parallelData) {
    data.number = parallelToMainchainBlockHeightMapping[data.number];

    for (const datum of data.extensionDatums) {
      datum.blockNumber = parallelToMainchainBlockHeightMapping[datum.blockNumber];
    }
  }
}

// Gets the latest processed block in a particular chain. Used to restore the
// synchronization point after a restart.
async function restoreLastPointCheckpointFromDb(
  cachedState: { lastBlock: number; startingBlockHeight: number },
  dbTx: PoolClient,
  chainName: string
): Promise<void> {
  if (!cachedState.lastBlock) {
    const queryResults = await getLatestProcessedCdeBlockheight.run({ network: chainName }, dbTx);

    if (queryResults[0]) {
      // If we are in `readData`, we know that the presync stage finished.
      // This means `readPresyncData` was actually called with the entire
      // range up to startBlockHeight - 1 (inclusive), since that's the stop
      // condition for the presync. So there is no point in starting from
      // earlier than that, since we know there are no events there.
      cachedState.lastBlock = Math.max(
        queryResults[0].block_height,
        cachedState.startingBlockHeight - 1
      );
    }
  }
}

export async function wrapToAvailFunnel(
  chainFunnel: ChainFunnel,
  sharedData: FunnelSharedData,
  dbTx: PoolClient,
  startingBlockHeight: number,
  chainName: string,
  config: AvailConfig
): Promise<ChainFunnel> {
  try {
    const ebp = await AvailFunnel.recoverState(
      sharedData,
      dbTx,
      chainFunnel,
      chainName,
      config,
      startingBlockHeight
    );
    return ebp;
  } catch (err) {
    doLog('[paima-funnel] Unable to initialize avail events processor:');
    logError(err);
    throw new Error('[paima-funnel] Unable to initialize avail events processor');
  }
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

async function getDAData(
  lc: string,
  from: number,
  to: number,
  network: string
): Promise<{ blockNumber: number; extensionDatums: CdeGenericDatum[] }[]> {
  const data = [] as { blockNumber: number; extensionDatums: CdeGenericDatum[] }[];

  for (let curr = from; curr <= to; curr++) {
    const responseRaw = await fetch(`${lc}/v2/blocks/${curr}/data`);

    // TODO: handle better the status code ( not documented in the api though ).
    if (responseRaw.status !== 200) {
      continue;
    }

    const response = (await responseRaw.json()) as unknown as {
      block_number: number;
      data_transactions: { data: string }[];
    };

    if (response.data_transactions.length > 0) {
      // not sure how this would be controlled by extensions yet, so for now we
      // just generate a generic event, since the app_id is in the client, and the
      // data doesn't have a format.
      data.push({
        blockNumber: response.block_number,
        extensionDatums: response.data_transactions.map(d => ({
          cdeName: 'availDefaultExtension',
          blockNumber: response.block_number,
          transactionHash: 'hash',
          payload: { data: d.data },
          cdeDatumType: ChainDataExtensionDatumType.Generic,
          scheduledPrefix: 'avail',
          network: network,
        })),
      });
    }
  }

  return data;
}

// TODO: duplicated? it's not exactly the same though
export function composeChainData(baseChainData: ChainData[], cdeData: BlockData[]): ChainData[] {
  return baseChainData.map(blockData => {
    const matchingData = cdeData.find(
      blockCdeData => blockCdeData.number === blockData.blockNumber
    );

    if (!matchingData) {
      return blockData;
    }

    if (blockData.extensionDatums) {
      if (matchingData.extensionDatums) {
        blockData.extensionDatums.push(...matchingData.extensionDatums);
      }
    } else if (matchingData.extensionDatums) {
      blockData.extensionDatums = matchingData.extensionDatums;
    }

    return blockData;
  });
}

// This adds the internal event that updates the last block point. This is
// mostly to avoid having to do a binary search each time we boot the
// engine. Since we need to know from where to start searching for blocks in
// the timestamp range.
function addInternalCheckpointingEvent(
  chainData: ChainData[],
  mapBlockNumber: (mainchainNumber: number) => number,
  chainName: string,
  // FIXME: not really clear why this ignore is needed
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  eventType: InternalEventType.EvmLastBlock | InternalEventType.AvailLastBlock
): void {
  for (const data of chainData) {
    const originalBlockNumber = mapBlockNumber(data.blockNumber);
    // it's technically possible for this to be null, because there may not be
    // a block of the sidechain in between a particular pair of blocks or the
    // original chain.
    //
    // in this case it could be more optimal to set the block number here to
    // the one in the next block, but it shouldn't make much of a difference.
    if (!originalBlockNumber) {
      continue;
    }

    if (!data.internalEvents) {
      data.internalEvents = [];
    }
    data.internalEvents.push({
      type: eventType,
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
      network: chainName,
    });
  }
}

async function readFromBaseFunnel(
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
