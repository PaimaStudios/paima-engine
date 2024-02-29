import type { CardanoConfig } from '@paima/utils';
import {
  ChainDataExtensionType,
  DEFAULT_FUNNEL_TIMEOUT,
  delay,
  doLog,
  GlobalConfig,
  logError,
  timeout,
  ConfigNetworkType,
} from '@paima/utils';
import type { CardanoPresyncChainData, EvmPresyncChainData, InternalEvent } from '@paima/sm';
import {
  type ChainData,
  type ChainDataExtension,
  type ChainDataExtensionDatum,
  type PresyncChainData,
} from '@paima/sm';
import { composeChainData, groupCdeData } from '../../utils.js';
import type { FunnelSharedData } from '../BaseFunnel.js';
import { BaseFunnel } from '../BaseFunnel.js';
import type { PoolClient } from 'pg';
import type { ChainFunnel, ReadPresyncDataFrom } from '@paima/runtime';
import getCdePoolData from '../../cde/cardanoPool.js';
import getCdeProjectedNFTData from '../../cde/cardanoProjectedNFT.js';
import getCdeDelayedAsset from '../../cde/delayedAsset.js';
import getCdeTransferData from '../../cde/cardanoTransfer.js';
import { query } from '@dcspark/carp-client/client/src/index';
import { Routes } from '@dcspark/carp-client/shared/routes';
import { FUNNEL_PRESYNC_FINISHED, InternalEventType } from '@paima/utils';
import { CarpFunnelCacheEntry } from '../FunnelCache.js';
import { getCardanoEpoch, getCarpCursors } from '@paima/db';
import type { BlockTxPair } from 'tmp-carp-client/shared/models/common';

const delayForWaitingForFinalityLoop = 1000;
const DEFAULT_PRESYNC_SLOT_RANGE = 10000;

type Era = {
  firstSlot: number;
  startEpoch: number;
  slotsPerEpoch: number;
  timestamp: number;
};

function shelleyEra(config: CardanoConfig): Era {
  switch (config.network) {
    case 'preview':
      return {
        firstSlot: 0,
        startEpoch: 0,
        slotsPerEpoch: 86400,
        timestamp: 1666656000,
      };
    case 'preprod':
      return {
        firstSlot: 86400,
        startEpoch: 4,
        slotsPerEpoch: 432000,
        timestamp: 1655769600,
      };
    case 'mainnet':
      return {
        firstSlot: 4492800,
        startEpoch: 208,
        slotsPerEpoch: 432000,
        timestamp: 1596059091,
      };
    default:
      throw new Error('unknown cardano network');
  }
}

function absoluteSlotToEpoch(era: Era, slot: number): number {
  const slotRelativeToEra = slot - era.firstSlot;

  if (slotRelativeToEra >= 0) {
    return era.startEpoch + Math.floor(slotRelativeToEra / era.slotsPerEpoch);
  } else {
    // this shouldn't really happen in practice, unless for some reason the
    // indexed EVM blocks are older than the start of the shelley era (which
    // does not apply to the presync).
    throw new Error('slot number is not in the current era');
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
function timestampToAbsoluteSlot(era: Era, timestamp: number, confirmationDepth: number): number {
  const cardanoAvgBlockPeriod = 20;
  // map timestamps with a delta, since we are waiting for blocks.
  const confirmationTimeDelta = cardanoAvgBlockPeriod * confirmationDepth;

  return timestamp - confirmationTimeDelta - era.timestamp + era.firstSlot;
}

export class CarpFunnel extends BaseFunnel implements ChainFunnel {
  protected constructor(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    private readonly baseFunnel: ChainFunnel,
    private readonly carpUrl: string,
    private cache: CarpFunnelCacheEntry,
    private readonly config: CardanoConfig,
    private readonly chainName: string
  ) {
    super(sharedData, dbTx);
    // TODO: replace once TS5 decorators are better supported
    this.readData.bind(this);
    this.readPresyncData.bind(this);
    this.getDbTx.bind(this);
    this.bufferedData = null;
    this.era = shelleyEra(config);
    this.config = config;
  }

  private bufferedData: ChainData[] | null;
  private era: Era;

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
      this.config.confirmationDepth,
      this.era,
      this.chainName,
      this.config.paginationLimit
    );

    const composed = composeChainData(this.bufferedData, grouped);

    for (const data of composed) {
      if (!data.internalEvents) {
        data.internalEvents = [] as InternalEvent[];

        const epoch = absoluteSlotToEpoch(
          this.era,
          timestampToAbsoluteSlot(this.era, data.timestamp, this.config.confirmationDepth)
        );

        const prevEpoch = this.cache.getState().epoch;

        if (!prevEpoch || epoch !== prevEpoch) {
          data.internalEvents.push({
            type: InternalEventType.CardanoBestEpoch,
            epoch: epoch,
          });

          // The execution of the event that we just pushed should set the
          // `cardano_last_epoch` table to `epoch`. This cache entry mirrors the
          // value of that table, so we need to update it here too.
          this.cache.updateEpoch(epoch);
        }
      }
    }

    this.bufferedData = null;

    return composed;
  }

  public override async readPresyncData(
    args: ReadPresyncDataFrom
  ): Promise<{ [network: number]: PresyncChainData[] | typeof FUNNEL_PRESYNC_FINISHED }> {
    let basePromise = this.baseFunnel.readPresyncData(args);

    const stableBlock = await timeout(
      query(this.carpUrl, Routes.blockLatest, {
        offset: Number(this.config.confirmationDepth),
      }),
      DEFAULT_FUNNEL_TIMEOUT
    );

    const cursors = this.cache.getState().cursors;

    if (cursors && Object.values(cursors).every(x => x.finished)) {
      const data = await basePromise;
      data[this.chainName] = FUNNEL_PRESYNC_FINISHED;

      return data;
    }

    const getSlotRange = ({
      cdeId,
      startSlot,
    }: {
      cdeId: number;
      startSlot: number;
    }): { from: number; to: number } => {
      const cursors = this.cache.getState().cursors;
      const from: number = (cursors && (cursors[cdeId] as { slot: number }).slot) || startSlot;
      const to = from + DEFAULT_PRESYNC_SLOT_RANGE;

      // the cache gets invalidated on error, so we can update the cursor before
      // even returning the event without risk.
      this.cache.updateCursor(cdeId, {
        kind: 'slot',
        slot: to,
        finished: to >= this.cache.getState().startingSlot,
      });

      return {
        from,
        to,
      };
    };

    const cache = this.cache;
    const mapCursorPaginatedData = (cdeId: number) => (datums: any) => {
      // we are providing the entire indexed range, so if carp
      // returns nothing we know the presync is finished for this
      // CDE.
      const finished = datums.length === 0 || datums.length < this.config.paginationLimit;

      cache.updateCursor(cdeId, {
        kind: 'paginationCursor',
        cursor: datums[datums.length - 1] ? datums[datums.length - 1].paginationCursor.cursor : '',
        finished,
      });

      if (datums.length > 0) {
        datums[datums.length - 1].paginationCursor.finished = finished;
      }

      return datums;
    };

    const [carpEvents, data] = await Promise.all([
      Promise.all(
        this.sharedData.extensions
          .filter(extension => {
            if (!('startSlot' in extension)) {
              return false;
            }

            if (cursors) {
              const cursor = cursors[extension.cdeId];

              if (!cursor) {
                return true;
              }

              return !cursor.finished;
            } else {
              return true;
            }
          })
          .map(extension => {
            switch (extension.cdeType) {
              case ChainDataExtensionType.CardanoPool: {
                const cursors = this.cache.getState().cursors;
                const startingSlot = this.cache.getState().startingSlot - 1;

                const cursor = cursors && cursors[extension.cdeId];

                console.log('min', Math.min(startingSlot, extension.stopSlot || startingSlot));

                const data = getCdePoolData(
                  this.carpUrl,
                  extension,
                  extension.startSlot,
                  Math.min(startingSlot, extension.stopSlot || startingSlot),
                  slot => slot,
                  slot => absoluteSlotToEpoch(this.era, slot),
                  true,
                  stableBlock.block.hash,
                  cursor && cursor.kind === 'paginationCursor'
                    ? (JSON.parse(cursor.cursor) as BlockTxPair)
                    : undefined,
                  this.config.paginationLimit
                ).then(mapCursorPaginatedData(extension.cdeId));

                return data.then(data => ({
                  cdeId: extension.cdeId,
                  cdeType: extension.cdeType,
                  data,
                }));
              }
              case ChainDataExtensionType.CardanoProjectedNFT: {
                const { from, to } = getSlotRange(extension);

                const data = getCdeProjectedNFTData(
                  this.carpUrl,
                  extension,
                  from,
                  Math.min(to, this.cache.getState().startingSlot - 1),
                  slot => slot
                );

                return data.then(data => ({
                  cdeId: extension.cdeId,
                  cdeType: extension.cdeType,
                  data,
                }));
              }
              case ChainDataExtensionType.CardanoAssetUtxo: {
                const { from, to } = getSlotRange(extension);

                const data = getCdeDelayedAsset(
                  this.carpUrl,
                  extension,
                  from,
                  Math.min(to, this.cache.getState().startingSlot - 1),
                  slot => slot
                );

                return data.then(data => ({
                  cdeId: extension.cdeId,
                  cdeType: extension.cdeType,
                  data,
                }));
              }
              case ChainDataExtensionType.CardanoTransfer: {
                const cursors = this.cache.getState().cursors;
                const startingSlot = this.cache.getState().startingSlot - 1;

                const cursor = cursors && cursors[extension.cdeId];

                const data = getCdeTransferData(
                  this.carpUrl,
                  extension,
                  extension.startSlot,
                  Math.min(startingSlot, extension.stopSlot || startingSlot),
                  slot => slot,
                  true,
                  stableBlock.block.hash,
                  cursor && cursor.kind === 'paginationCursor'
                    ? (JSON.parse(cursor.cursor) as BlockTxPair)
                    : undefined,
                  this.config.paginationLimit
                ).then(mapCursorPaginatedData(extension.cdeId));

                return data.then(data => ({
                  cdeId: extension.cdeId,
                  cdeType: extension.cdeType,
                  data,
                }));
              }
              default:
                throw new Error(`[carp funnel] unhandled extension: ${extension.cdeType}`);
            }
          })
      ),
      basePromise,
    ]);

    const list: CardanoPresyncChainData[] = [];

    for (const events of carpEvents) {
      if (
        events.cdeType === ChainDataExtensionType.CardanoTransfer ||
        events.cdeType === ChainDataExtensionType.CardanoPool
      ) {
        for (const event of events.data || []) {
          list.push({
            extensionDatums: [event],
            network: this.chainName,
            networkType: ConfigNetworkType.CARDANO,
            carpCursor: {
              kind: 'paginationCursor',
              cdeId: event.cdeId,
              cursor: event.paginationCursor.cursor,
              finished: event.paginationCursor.finished,
            },
          });
        }
      } else {
        // handle the cde's that are still on slot range based 'pagination' (not
        // really pagination, but emulated)
        const cursor = cursors && cursors[events.cdeId];
        const finished = (cursor && cursor.kind === 'slot' && cursor.finished) || false;

        // add an empty event so that the slot range gets updated even if there
        // are no events, since it's not a real pagination cursor
        if (events.data.length === 0) {
          const slot = (cursor && cursor.kind === 'slot' && cursor.slot) || 0;
          list.push({
            extensionDatums: [],
            networkType: ConfigNetworkType.CARDANO,
            network: this.chainName,
            carpCursor: {
              kind: 'slot',
              cdeId: events.cdeId,
              slot,
              finished,
            },
          });
        }

        // group by slot by traversing in order, if two consecutive entries have
        // the same slot then add them to the last entry.
        //
        // it's important to group by slot since that's how the 'cursor' is updated.
        // this code can be removed when we implement pagination by (tx,block).
        let slot;
        for (let i = 0; i < events.data.length; i++) {
          const event = events.data[i];
          const isLastAndFinished = (i == events.data.length - 1 && finished) || false;

          if (slot && slot === event.blockNumber) {
            list[list.length - 1].extensionDatums.push(event);
            list[list.length - 1].carpCursor.finished = isLastAndFinished;
          } else {
            slot = event.blockNumber;

            list.push({
              extensionDatums: [event],
              networkType: ConfigNetworkType.CARDANO,
              network: this.chainName,
              carpCursor: {
                kind: 'slot',
                cdeId: event.cdeId,
                slot: event.blockNumber,
                finished: isLastAndFinished,
              },
            });
          }
        }
      }
    }

    data[this.chainName] = list;

    return data;
  }

  public static async recoverState(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    baseFunnel: ChainFunnel,
    config: CardanoConfig,
    startingBlockHeight: number,
    chainName: string
  ): Promise<CarpFunnel> {
    if (!config.confirmationDepth) {
      throw new Error('[carp-funnel] Missing CARDANO_CONFIRMATION_DEPTH setting.');
    }

    const confirmationDepth = config.confirmationDepth;

    const cacheEntry = (async (): Promise<CarpFunnelCacheEntry> => {
      const entry = sharedData.cacheManager.cacheEntries[CarpFunnelCacheEntry.SYMBOL];
      if (entry != null && entry.initialized()) return entry;

      const newEntry = new CarpFunnelCacheEntry();
      sharedData.cacheManager.cacheEntries[CarpFunnelCacheEntry.SYMBOL] = newEntry;

      newEntry.updateStartingSlot(
        timestampToAbsoluteSlot(
          shelleyEra(config),
          (await sharedData.web3.eth.getBlock(startingBlockHeight)).timestamp as number,
          confirmationDepth
        )
      );

      const epoch = await getCardanoEpoch.run(undefined, dbTx);

      if (epoch.length === 1) {
        newEntry.updateEpoch(epoch[0].epoch);
      }

      const cursors = await getCarpCursors.run(undefined, dbTx);

      for (const cursor of cursors) {
        const kind = sharedData.extensions.find(extension => extension.cdeId === cursor.cde_id);

        const slotBased =
          kind?.cdeType !== ChainDataExtensionType.CardanoTransfer &&
          kind?.cdeType !== ChainDataExtensionType.CardanoPool;

        if (slotBased) {
          newEntry.updateCursor(cursor.cde_id, {
            kind: 'slot',
            slot: Number(cursor.cursor),
            finished: cursor.finished,
          });
        } else {
          newEntry.updateCursor(cursor.cde_id, {
            kind: 'paginationCursor',
            cursor: cursor.cursor,
            finished: cursor.finished,
          });
        }
      }

      return newEntry;
    })();

    return new CarpFunnel(
      sharedData,
      dbTx,
      baseFunnel,
      config.carpUrl,
      await cacheEntry,
      config,
      chainName
    );
  }
}

async function readDataInternal(
  data: ChainData[],
  carpUrl: string,
  extensions: ChainDataExtension[],
  lastTimestamp: number,
  cache: CarpFunnelCacheEntry,
  confirmationDepth: number,
  era: Era,
  chainName: string,
  paginationLimit: number
): Promise<EvmPresyncChainData[]> {
  // the lower range is exclusive
  const min = timestampToAbsoluteSlot(era, lastTimestamp, confirmationDepth);
  // the upper range is inclusive
  const maxElement = data[data.length - 1];

  const max = timestampToAbsoluteSlot(era, maxElement.timestamp, confirmationDepth);

  cache.updateLastPoint(maxElement.blockNumber, maxElement.timestamp);

  let stableBlockId: string;

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
      stableBlockId = stableBlock.block.hash;
      break;
    }

    await delay(delayForWaitingForFinalityLoop);
  }

  const blockNumbers = data.reduce(
    (dict, data) => {
      dict[timestampToAbsoluteSlot(era, data.timestamp, confirmationDepth)] = data.blockNumber;
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
          const poolData = getCdePoolData(
            carpUrl,
            extension,
            min,
            Math.min(max, extension.stopSlot || max),
            mapSlotToBlockNumber,
            slot => absoluteSlotToEpoch(era, slot),
            false, // not presync
            stableBlockId,
            undefined, // we want everything in the range, so no starting point for the pagination
            paginationLimit
          );
          return poolData;
        case ChainDataExtensionType.CardanoProjectedNFT:
          const projectedNFTData = getCdeProjectedNFTData(
            carpUrl,
            extension,
            min,
            Math.min(max, extension.stopSlot || max),
            mapSlotToBlockNumber
          );
          return projectedNFTData;
        case ChainDataExtensionType.CardanoAssetUtxo:
          const delayedAssetData = getCdeDelayedAsset(
            carpUrl,
            extension,
            min,
            Math.min(max, extension.stopSlot || max),
            mapSlotToBlockNumber
          );
          return delayedAssetData;
        case ChainDataExtensionType.CardanoTransfer:
          const transferData = getCdeTransferData(
            carpUrl,
            extension,
            min,
            Math.min(max, extension.stopSlot || max),
            mapSlotToBlockNumber,
            false, // not presync
            stableBlockId,
            undefined, // we want everything in the range, so no starting point for the pagination
            paginationLimit
          );

          return transferData;
        default:
          return Promise.resolve([]);
      }
    })
  );

  let grouped = groupCdeData(
    chainName,
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
  startingBlockHeight: number
): Promise<ChainFunnel> {
  const config = await GlobalConfig.cardanoConfig();

  if (!config) {
    return chainFunnel;
  }

  const [chainName, cardanoConfig] = config;

  try {
    const ebp = await CarpFunnel.recoverState(
      sharedData,
      dbTx,
      chainFunnel,
      cardanoConfig,
      startingBlockHeight,
      chainName
    );
    return ebp;
  } catch (err) {
    doLog('[paima-funnel] Unable to initialize carp events processor:');
    logError(err);
    throw new Error('[paima-funnel] Unable to initialize carp events processor');
  }
}
