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
import type { CdeGenericDatum } from '@paima/sm';
import { type ChainData, type PresyncChainData } from '@paima/sm';
import { BaseFunnel } from '../BaseFunnel.js';
import type { FunnelSharedData } from '../BaseFunnel.js';
import type { AvailFunnelCacheEntryState } from '../FunnelCache.js';
import { AvailFunnelCacheEntry } from '../FunnelCache.js';
import type { PoolClient } from 'pg';
import { FUNNEL_PRESYNC_FINISHED } from '@paima/utils';
import type { ApiPromise } from 'avail-js-sdk';
import { createApi } from './createApi.js';
import type { Header } from '@polkadot/types/interfaces/types.js';
import { getLatestProcessedCdeBlockheight } from '@paima/db';

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

    // if in the previous round we couldn't return some blocks because the
    // parallel chain didn't get far enough, we first process those.
    if (cachedState.bufferedChainData.length === 0) {
      const baseData = await this.baseFunnel.readData(blockHeight);
      cachedState.bufferedChainData.push(...baseData);
    }

    await this.updateLatestBlock();
    const latestBlockQueryState = this.latestBlock();
    const latestHeaderTimestamp = slotToTimestamp(latestBlockQueryState.slot, cachedState.api);

    const chainData: ChainData[] = [];

    // filter the data so that we are sure we can get all the blocks in the range
    for (const data of cachedState.bufferedChainData) {
      if (applyDelay(this.config, data.timestamp) <= latestHeaderTimestamp) {
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
          cachedState.startingBlockHeight - 1
        );
      }
    }

    // fetch headers from avail
    const maxSlot = timestampToSlot(
      applyDelay(this.config, chainData[chainData.length - 1].timestamp),
      cachedState.api
    );

    const headers = [];
    const availSubmittedData = [];

    while (true) {
      const latestBlock = this.latestBlock();
      const to = Math.min(
        latestBlock.number,
        cachedState.lastBlock + this.config.funnelBlockGroupSize
      );

      doLog(`Avail funnel #${cachedState.lastBlock + 1}-${to}`);

      availSubmittedData.push(
        ...(await getDAData(this.config.lightClient, cachedState.lastBlock + 1, to, this.chainName))
      );

      let availHeaders;

      if (availSubmittedData.length > 0) {
        const numbers = availSubmittedData.map(d => d.blockNumber);

        // we only need at least one to have some idea of where we are in time.
        // otherwise if there is no data submitted for the app we would never
        // exit this loop.
        if (numbers[numbers.length - 1] !== to) {
          numbers.push(to);
        }

        // get only headers for block that have data
        availHeaders = await getMultipleHeaderData(cachedState.api, numbers);
      } else {
        // unless the range is empty
        availHeaders = await getMultipleHeaderData(cachedState.api, [to]);
      }

      headers.push(...availHeaders);

      if (headers.length > 0) {
        const last = headers[headers.length - 1];

        cachedState.lastBlock = last.number;
      }

      if (headers.length > 0 && headers[headers.length - 1].slot >= maxSlot) {
        break;
      }

      if (to !== latestBlock.number) continue;
      while ((await this.updateLatestBlock()) === latestBlock?.number) {
        // wait for blocks to be produced
        await delay(500);
      }
    }

    for (const availBlock of availSubmittedData) {
      const availHeader = headers.find(h => h.number === availBlock.blockNumber);

      if (!availHeader) {
        throw new Error("Couldn't get header for block with app data");
      }

      cachedState.timestampToBlock.push([availHeader.slot * 20, availBlock]);
      cachedState.latestBlock = availHeader;
    }

    while (true) {
      if (cachedState.timestampToBlock.length === 0) {
        return chainData;
      }

      // delete old entries
      if (cachedState.timestampToBlock[0][0] <= cachedState.lastMaxSlot * 20) {
        cachedState.timestampToBlock.shift();
      } else {
        break;
      }
    }

    cachedState.lastMaxSlot = maxSlot;

    const availToMainchainBlockHeightMapping: { [blockNumber: number]: number } = {};
    // Mapping of mainchain to sidechain block heights
    const mainchainToAvailBlockHeightMapping: { [blockNumber: number]: number } = {};

    let currIndex = 0;

    for (const availBlock of cachedState.timestampToBlock) {
      while (currIndex < chainData.length) {
        if (applyDelay(this.config, chainData[currIndex].timestamp) >= availBlock[0]) {
          availToMainchainBlockHeightMapping[availBlock[1].blockNumber] =
            chainData[currIndex].blockNumber;

          mainchainToAvailBlockHeightMapping[chainData[currIndex].blockNumber] =
            availBlock[1].blockNumber;
          break;
        } else {
          currIndex++;
        }
      }
    }

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

    const availData = availSubmittedData.filter(d => d.blockNumber <= toBlock);

    for (const data of availData) {
      data.blockNumber = availToMainchainBlockHeightMapping[data.blockNumber];

      for (const datum of data.extensionDatums) {
        datum.blockNumber = availToMainchainBlockHeightMapping[datum.blockNumber];
      }
    }

    composeChainData(chainData, availData);

    addInternalCheckpointingEvent(
      chainData,
      n => mainchainToAvailBlockHeightMapping[n],
      this.chainName,
      InternalEventType.AvailLastBlock
    );

    return chainData;
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
        api,
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

type HeaderData = { number: number; hash: string; slot: number };

async function getMultipleHeaderData(
  api: ApiPromise,
  blockNumbers: number[]
): Promise<HeaderData[]> {
  const results = [] as HeaderData[];

  for (const bn of blockNumbers) {
    // NOTE: the light client allows getting header directly from block number,
    // but it doesn't provide the babe data for the slot
    const hash = await api.rpc.chain.getBlockHash(bn);
    const header = await api.rpc.chain.getHeader(hash);

    const slot = getSlotFromHeader(header, api);

    results.push({
      number: header.number.toNumber(),
      hash: header.hash.toString(),
      slot: slot,
    });
  }

  return results;
}

function getSlotFromHeader(header: Header, api: ApiPromise): number {
  const preRuntime = header.digest.logs.find(log => log.isPreRuntime)!.asPreRuntime;

  const rawBabeDigest = api.createType('RawBabePreDigest', preRuntime[1]);

  const babeDigest = rawBabeDigest.toPrimitive() as unknown as any;

  // the object is an enumeration, but all the variants have a slotNumber field
  const slot = babeDigest[Object.getOwnPropertyNames(babeDigest)[0]].slotNumber;
  return slot;
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

    // TODO: handle better the status code ( not documented ).
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
export function composeChainData(
  baseChainData: ChainData[],
  cdeData: { blockNumber: number; extensionDatums: CdeGenericDatum[] }[]
): ChainData[] {
  return baseChainData.map(blockData => {
    const matchingData = cdeData.find(
      blockCdeData => blockCdeData.blockNumber === blockData.blockNumber
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

// TODO: duplicated code
/*
 * performs binary search to find the block corresponding to a specific timestamp
 * Note: if there are multiple blocks with the same timestamp
 * @returns the index of the first block that occurs > targetTimestamp
 */
async function findBlockByTimestamp(
  api: ApiPromise,
  targetTimestamp: number,
  chainName: string,
  getTimestampForBlock: (at: number) => Promise<number>
): Promise<number> {
  // the genesis doesn't have a slot to extract a timestamp from
  let low = 1;

  let high = await getLatestBlockNumber(api);

  let requests = 0;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);

    const ts = await getTimestampForBlock(mid);

    requests++;

    // recall: there may be many blocks with the same targetTimestamp
    // in this case, <= means we slowly increase `low` to return the most recent block with that timestamp
    if (ts <= targetTimestamp) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  doLog(
    `avail funnel: Found block #${low} on ${chainName} by binary search with ${requests} requests`
  );

  return low;
}

async function getLatestBlockNumber(api: ApiPromise): Promise<number> {
  let highHash = await api.rpc.chain.getFinalizedHead();
  let high = (await api.rpc.chain.getHeader(highHash)).number.toNumber();
  return high;
}

async function getTimestampForBlockAt(api: ApiPromise, mid: number): Promise<number> {
  const hash = await api.rpc.chain.getBlockHash(mid);
  const header = await api.rpc.chain.getHeader(hash);

  const slot = getSlotFromHeader(header, api);
  return slotToTimestamp(slot, api);
}

function slotToTimestamp(slot: number, api: ApiPromise): number {
  // this is how it's computed by the pallet
  // https://paritytech.github.io/polkadot-sdk/master/src/pallet_babe/lib.rs.html#533
  const slotDuration = (Number.parseInt(api.consts.timestamp.minimumPeriod.toString()) * 2) / 1000;

  // slots start at unix epoch:
  // https://paritytech.github.io/polkadot-sdk/master/src/pallet_babe/lib.rs.html#902
  return slot * slotDuration;
}

// inverse to `slotToTimestamp`
function timestampToSlot(timestamp: number, api: ApiPromise): number {
  const slotDuration = (Number.parseInt(api.consts.timestamp.minimumPeriod.toString()) * 2) / 1000;

  // slots start at the unix epoch regardless of the genesis timestamp
  return timestamp / slotDuration;
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
