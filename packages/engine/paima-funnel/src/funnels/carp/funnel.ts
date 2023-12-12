import {
  ChainDataExtensionType,
  DEFAULT_FUNNEL_TIMEOUT,
  ENV,
  Network,
  delay,
  doLog,
  logError,
  timeout,
} from '@paima/utils';
import type { ChainDataExtensionDatum } from '@paima/sm';
import {
  type ChainData,
  type ChainDataExtension,
  type ChainDataExtensionCardanoDelegation,
  type PresyncChainData,
} from '@paima/sm';
import { composeChainData, groupCdeData } from '../../utils.js';
import { BaseFunnel } from '../BaseFunnel.js';
import type { FunnelSharedData } from '../BaseFunnel.js';
import type { PoolClient } from 'pg';
import type { ChainFunnel, ReadPresyncDataFrom } from '@paima/runtime';
import getCdePoolData from '../../cde/cardanoPool.js';
import { query } from '@dcspark/carp-client/client/src/index';
import { Routes } from '@dcspark/carp-client/shared/routes';
import { FUNNEL_PRESYNC_FINISHED } from '@paima/utils/src/constants';
import { CarpFunnelCacheEntry } from '../FunnelCache.js';

const delayForWaitingForFinalityLoop = 1000;

// This returns the unix timestamp of the first block in the Shelley era of the
// configured network, and the slot of the corresponding block.
function knownShelleyTime(): { timestamp: number; absoluteSlot: number } {
  switch (ENV.CARDANO_NETWORK) {
    case 'preview':
      return { timestamp: 1666656000, absoluteSlot: 0 };
    case 'preprod':
      return { timestamp: 1655769600, absoluteSlot: 86400 };
    case 'mainnet':
      return { timestamp: 1596059091, absoluteSlot: 4492800 };
    default:
      throw new Error('unknown cardano network');
  }
}

/*
Maps an EVM timestamp to a unique absolute slot in Cardano.

Conceptually, we want to pair the EVM blocks with the slot that is closest in
time to it. In this case, an EVM block that happened exactly at the same second
as the first Shelley block will get assigned to that slot.

However, since we need to wait for finality, an offset is subtracted first
from the timestamp, so that the matching is done to blocks slightly in the past,
since otherwise we would have to wait for confirmation all the time.

Note: The state pairing only matters after the presync stage is done, so as
long as the timestamp of the block specified in START_BLOCKHEIGHT happens after
the first Shelley block, we don't need to consider the previous Cardano era (if any).
*/
function timestampToAbsoluteSlot(timestamp: number, confirmationDepth: number): number {
  const cardanoAvgBlockPeriod = 20;
  // map timestamps with a delta, since we are waiting for blocks.
  const confirmationTimeDelta = cardanoAvgBlockPeriod * confirmationDepth;

  const era = knownShelleyTime();

  return timestamp - confirmationTimeDelta - era.timestamp + era.absoluteSlot;
}

export class CarpFunnel extends BaseFunnel implements ChainFunnel {
  protected constructor(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    private readonly baseFunnel: ChainFunnel,
    private readonly carpUrl: string,
    private cache: CarpFunnelCacheEntry,
    private readonly confirmationDepth: number
  ) {
    super(sharedData, dbTx);
    // TODO: replace once TS5 decorators are better supported
    this.readData.bind(this);
    this.readPresyncData.bind(this);
    this.getDbTx.bind(this);
    this.bufferedData = null;
  }

  private bufferedData: ChainData[] | null;

  public override async readData(blockHeight: number): Promise<ChainData[]> {
    if (!this.bufferedData || this.bufferedData[0].blockNumber != blockHeight) {
      const data = await this.baseFunnel.readData(blockHeight);

      if (data.length === 0) {
        return data;
      }

      this.bufferedData = data;
    }

    const cachedState = this.cache.getState().lastPoint;

    let lastTimestamp;

    // there are most likely some slots between the last end of range and the
    // first block in the current range, so we need to start from the previous point.
    if (cachedState && cachedState.blockHeight == blockHeight - 1) {
      // this is the last timestamp that was queried as the max in the previous pull
      lastTimestamp = cachedState.timestamp;
    } else {
      lastTimestamp = await timeout(
        this.sharedData.web3.eth.getBlock(blockHeight - 1),
        DEFAULT_FUNNEL_TIMEOUT
      );

      lastTimestamp = lastTimestamp.timestamp as number;
    }

    let grouped = await readDataInternal(
      this.bufferedData,
      this.carpUrl,
      this.sharedData.extensions,
      lastTimestamp,
      this.cache,
      this.confirmationDepth
    );

    const composed = composeChainData(this.bufferedData, grouped);

    this.bufferedData = null;

    return composed;
  }

  public override async readPresyncData(
    args: ReadPresyncDataFrom
  ): Promise<{ [network: number]: PresyncChainData[] | typeof FUNNEL_PRESYNC_FINISHED }> {
    const arg = args.find(arg => arg.network == Network.CARDANO);

    let basePromise = this.baseFunnel.readPresyncData(args);

    if (arg && arg.from >= 0 && arg.from < this.cache.getState().startingSlot) {
      const [poolEvents, data] = await Promise.all([
        Promise.all(
          this.sharedData.extensions
            .filter(extension => extension.cdeType === ChainDataExtensionType.CardanoPool)
            .map(extension => {
              const data = getCdePoolData(
                this.carpUrl,
                extension as ChainDataExtensionCardanoDelegation,
                arg.from,
                Math.min(arg.to, this.cache.getState().startingSlot - 1),
                slot => {
                  return slot;
                }
              );
              return data;
            })
        ),
        basePromise,
      ]);

      let grouped = groupCdeData(Network.CARDANO, arg.from, arg.to, poolEvents);

      if (grouped.length > 0) {
        data[Network.CARDANO] = grouped;
      }

      return data;
    } else {
      const data = await basePromise;

      if (arg) {
        data[Network.CARDANO] = FUNNEL_PRESYNC_FINISHED;
      }

      return data;
    }
  }

  public static async recoverState(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    baseFunnel: ChainFunnel,
    carpUrl: string,
    startingBlockHeight: number
  ): Promise<CarpFunnel> {
    if (!ENV.CARDANO_CONFIRMATION_DEPTH) {
      throw new Error('[carp-funnel] Missing CARDANO_CONFIRMATION_DEPTH setting.');
    }

    const confirmationDepth = ENV.CARDANO_CONFIRMATION_DEPTH;

    const cacheEntry = (async (): Promise<CarpFunnelCacheEntry> => {
      const entry = sharedData.cacheManager.cacheEntries[CarpFunnelCacheEntry.SYMBOL];
      if (entry != null && entry.initialized()) return entry;

      const newEntry = new CarpFunnelCacheEntry();
      sharedData.cacheManager.cacheEntries[CarpFunnelCacheEntry.SYMBOL] = newEntry;

      newEntry.updateStartingSlot(
        timestampToAbsoluteSlot(
          (await sharedData.web3.eth.getBlock(startingBlockHeight)).timestamp as number,
          confirmationDepth
        )
      );

      return newEntry;
    })();

    return new CarpFunnel(
      sharedData,
      dbTx,
      baseFunnel,
      carpUrl,
      await cacheEntry,
      confirmationDepth
    );
  }
}

async function readDataInternal(
  data: ChainData[],
  carpUrl: string,
  extensions: ChainDataExtension[],
  lastTimestamp: number,
  cache: CarpFunnelCacheEntry,
  confirmationDepth: number
): Promise<PresyncChainData[]> {
  // the lower range is exclusive
  const min = timestampToAbsoluteSlot(lastTimestamp, confirmationDepth);
  // the upper range is inclusive
  const maxElement = data[data.length - 1];

  const max = timestampToAbsoluteSlot(maxElement.timestamp, confirmationDepth);

  cache.updateLastPoint(maxElement.blockNumber, maxElement.timestamp);

  // Block finality depends on depth, and not on time, so it's possible that a
  // block at a non confirmed depth falls in the slot range that we are querying
  // here. This waits until the upper end of the range falls in the confirmed
  // zone.
  while (true) {
    const stableBlock = await timeout(
      query(carpUrl, Routes.blockLatest, {
        offset: Number(confirmationDepth),
      }),
      DEFAULT_FUNNEL_TIMEOUT
    );

    if (stableBlock.block.slot > max) {
      break;
    }

    await delay(delayForWaitingForFinalityLoop);
  }

  const blockNumbers = data.reduce(
    (dict, data) => {
      dict[timestampToAbsoluteSlot(data.timestamp, confirmationDepth)] = data.blockNumber;
      return dict;
    },
    {} as { [slot: number]: number }
  );

  // This extends blockNumbers but for intermediate slots.
  // Between two evm blocks there can be more than one slot, and the mapping only has the slots for blocks that exist.
  const mapSlotToBlockNumber = (slot: number): number => {
    while (true) {
      const curr = blockNumbers[slot];
      if (curr) {
        return curr;
      }
      slot += 1;
    }
  };

  const poolEvents = await Promise.all(
    extensions.map((extension: ChainDataExtension): Promise<ChainDataExtensionDatum[]> => {
      if ('stopSlot' in extension && extension.stopSlot && min >= extension.stopSlot) {
        return Promise.resolve([]);
      }

      switch (extension.cdeType) {
        case ChainDataExtensionType.CardanoPool:
          const data = getCdePoolData(
            carpUrl,
            extension,
            min,
            Math.min(max, extension.stopSlot || max),
            mapSlotToBlockNumber
          );

          return data;
        default:
          return Promise.resolve([]);
      }
    })
  );

  let grouped = groupCdeData(
    Network.EVM,
    data[0].blockNumber,
    data[data.length - 1].blockNumber,
    poolEvents.filter(data => data.length > 0)
  );

  return grouped;
}

export async function wrapToCarpFunnel(
  chainFunnel: ChainFunnel,
  sharedData: FunnelSharedData,
  dbTx: PoolClient,
  carpUrl: string | undefined,
  startingBlockHeight: number
): Promise<ChainFunnel> {
  if (!carpUrl) {
    return chainFunnel;
  }

  try {
    const ebp = await CarpFunnel.recoverState(
      sharedData,
      dbTx,
      chainFunnel,
      carpUrl,
      startingBlockHeight
    );
    return ebp;
  } catch (err) {
    doLog('[paima-funnel] Unable to initialize carp events processor:');
    logError(err);
    throw new Error('[paima-funnel] Unable to initialize carp events processor');
  }
}
