import { doLog, logError, ChainDataExtensionType, delay, ENV } from '@paima/utils';
import type { ChainFunnel, ReadPresyncDataFrom } from '@paima/runtime';
import type {
  ChainData,
  ChainDataExtensionDatum,
  MinaPresyncChainData,
  PresyncChainData,
} from '@paima/sm';
import { composeChainData, groupCdeData } from '../../utils.js';
import { BaseFunnel } from '../BaseFunnel.js';
import type { FunnelSharedData } from '../BaseFunnel.js';
import type { PoolClient } from 'pg';
import { FUNNEL_PRESYNC_FINISHED, ConfigNetworkType } from '@paima/utils';
import { getPaginationCursors } from '@paima/db';
import { getActionCdeData, getEventCdeData } from '../../cde/minaGeneric.js';
import type { MinaConfig } from '@paima/utils';
import { MinaFunnelCacheEntry } from '../FunnelCache.js';
import postgres from 'postgres';

const delayForWaitingForFinalityLoop = 1000;

async function getGenesisTime(pg: postgres.Sql): Promise<number> {
  const row = await pg`select timestamp from blocks where height = 1;`;

  return Number.parseInt(row[0]['timestamp'], 10);
}

async function findMinaConfirmedTimestamp(pg: postgres.Sql): Promise<number> {
  const row =
    await pg`select timestamp from blocks where chain_status = 'canonical' order by height desc limit 1;`;

  return Number.parseInt(row[0]['timestamp'], 10);
}

function slotToMinaTimestamp(slot: number, genesisTime: number, slotDuration: number): number {
  return slot * slotDuration * 1000 + genesisTime;
}

function minaTimestampToSlot(ts: number, genesisTime: number, slotDuration: number): number {
  return Math.max(Math.floor((ts - genesisTime) / (slotDuration * 1000)), 0);
}

function baseChainTimestampToMina(
  baseChainTimestamp: number,
  confirmationDepth: number,
  slotDuration: number
): number {
  return Math.max(baseChainTimestamp * 1000 - slotDuration * 1000 * confirmationDepth, 0);
}

export class MinaFunnel extends BaseFunnel implements ChainFunnel {
  config: MinaConfig;
  chainName: string;

  protected constructor(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    config: MinaConfig,
    chainName: string,
    private readonly baseFunnel: ChainFunnel,
    private cache: MinaFunnelCacheEntry
  ) {
    super(sharedData, dbTx);
    this.readData.bind(this);
    this.readPresyncData.bind(this);
    this.getDbTx.bind(this);
    this.config = config;
    this.chainName = chainName;
  }

  public override async readData(blockHeight: number): Promise<ChainData[]> {
    const baseData = await this.baseFunnel.readData(blockHeight);

    if (baseData.length === 0) {
      return baseData;
    }

    let cachedState = this.cache.getState();

    const maxBaseTimestamp = baseChainTimestampToMina(
      baseData[baseData.length - 1].timestamp,
      this.config.confirmationDepth,
      this.config.slotDuration
    );

    while (true) {
      const confirmedTimestamp = await findMinaConfirmedTimestamp(cachedState.pg);

      if (confirmedTimestamp >= maxBaseTimestamp) {
        break;
      }

      await delay(delayForWaitingForFinalityLoop);
    }

    const fromTimestamp =
      this.cache.getState().lastPoint?.timestamp || cachedState.startingSlotTimestamp;

    const toTimestamp = maxBaseTimestamp;

    const getBlockNumber = (state: { curr: number }) => (ts: number) => {
      while (
        state.curr < baseData.length &&
        baseChainTimestampToMina(
          baseData[state.curr].timestamp,
          this.config.confirmationDepth,
          this.config.slotDuration
        ) <= ts
      )
        state.curr++;

      if (state.curr < baseData.length) {
        return baseData[state.curr].blockNumber;
      } else {
        throw new Error('got event out of the expected range');
      }
    };

    const ungroupedCdeData = await Promise.all(
      this.sharedData.extensions.reduce(
        (promises, extension) => {
          if (extension.cdeType === ChainDataExtensionType.MinaEventGeneric) {
            const promise = getEventCdeData({
              pg: cachedState.pg,
              extension,
              fromTimestamp,
              toTimestamp,
              getBlockNumber: getBlockNumber({ curr: 0 }),
              network: this.chainName,
              isPresync: false,
              cursor: undefined,
              limit: this.config.paginationLimit,
            });

            promises.push(promise);
          }

          if (extension.cdeType === ChainDataExtensionType.MinaActionGeneric) {
            const promise = getActionCdeData({
              pg: cachedState.pg,
              extension,
              fromTimestamp,
              toTimestamp,
              getBlockNumber: getBlockNumber({ curr: 0 }),
              network: this.chainName,
              isPresync: false,
              cursor: undefined,
              limit: this.config.paginationLimit,
            });

            promises.push(promise);
          }

          return promises;
        },
        [] as Promise<ChainDataExtensionDatum[]>[]
      )
    );

    const grouped = groupCdeData(
      this.chainName,
      baseData[0].blockNumber,
      baseData[baseData.length - 1].blockNumber,
      ungroupedCdeData.filter(data => data.length > 0)
    );

    const composed = composeChainData(baseData, grouped);

    return composed;
  }

  public override async readPresyncData(
    args: ReadPresyncDataFrom
  ): Promise<{ [network: string]: PresyncChainData[] | typeof FUNNEL_PRESYNC_FINISHED }> {
    const basePromise = this.baseFunnel.readPresyncData(args);

    const cache = this.cache.getState();

    const cursors = cache.cursors;

    if (cursors && Object.values(cursors).every(x => x.finished)) {
      const data = await basePromise;
      data[this.chainName] = FUNNEL_PRESYNC_FINISHED;

      return data;
    }

    const mapCursorPaginatedData = (cdeId: number) => (datums: any) => {
      const finished = datums.length === 0 || datums.length < this.config.paginationLimit;

      this.cache.updateCursor(cdeId, {
        cursor: datums[datums.length - 1] ? datums[datums.length - 1].paginationCursor.cursor : '',
        finished,
      });

      if (datums.length > 0) {
        datums[datums.length - 1].paginationCursor.finished = finished;
      }

      return datums;
    };

    const startingSlotTimestamp = this.cache.getState().startingSlotTimestamp;

    try {
      const [baseData, ungroupedCdeData] = await Promise.all([
        basePromise,
        Promise.all(
          this.sharedData.extensions
            .filter(extension => {
              if (extension.network !== this.chainName) {
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
            .map(async extension => {
              if (extension.cdeType === ChainDataExtensionType.MinaEventGeneric) {
                let fromTimestamp = slotToMinaTimestamp(
                  extension.startSlot,
                  cache.genesisTime,
                  this.config.slotDuration
                );

                const cursor = cursors && cursors[extension.cdeId];

                const data = await getEventCdeData({
                  pg: cache.pg,
                  extension,
                  fromTimestamp,
                  toTimestamp: startingSlotTimestamp - 1,
                  // the handler for this cde stores the block height unmodified
                  // (even if the event is scheduled at the correct height), so
                  // handle this special case here, to have the events properly
                  // sorted.
                  getBlockNumber: _x => ENV.SM_START_BLOCKHEIGHT + 1,
                  network: this.chainName,
                  isPresync: true,
                  cursor: cursor?.cursor,
                  limit: this.config.paginationLimit,
                }).then(mapCursorPaginatedData(extension.cdeId));

                return {
                  cdeId: extension.cdeId,
                  cdeType: extension.cdeType,
                  data,
                };
              } else if (extension.cdeType === ChainDataExtensionType.MinaActionGeneric) {
                let fromTimestamp = slotToMinaTimestamp(
                  extension.startSlot,
                  cache.genesisTime,
                  this.config.slotDuration
                );

                const cursor = cursors && cursors[extension.cdeId];

                const data = await getActionCdeData({
                  pg: cache.pg,
                  extension,
                  fromTimestamp,
                  toTimestamp: startingSlotTimestamp - 1,
                  getBlockNumber: _x => ENV.SM_START_BLOCKHEIGHT + 1,
                  network: this.chainName,
                  isPresync: true,
                  cursor: cursor?.cursor,
                  limit: this.config.paginationLimit,
                }).then(mapCursorPaginatedData(extension.cdeId));

                return {
                  cdeId: extension.cdeId,
                  cdeType: extension.cdeType,
                  data,
                };
              } else {
                throw new Error(`[mina funnel] unhandled extension: ${extension.cdeType}`);
              }
            })
        ),
      ]);

      const list: MinaPresyncChainData[] = [];

      for (const events of ungroupedCdeData) {
        for (const event of events.data || []) {
          list.push({
            extensionDatums: [event],
            network: this.chainName,
            networkType: ConfigNetworkType.MINA,
            minaCursor: {
              cdeId: event.cdeId,
              cursor: event.paginationCursor.cursor,
              finished: event.paginationCursor.finished,
            },
          });
        }
      }

      baseData[this.chainName] = list;

      return baseData;
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
    config: MinaConfig,
    startingBlockHeight: number
  ): Promise<MinaFunnel> {
    const cacheEntry = (async (): Promise<MinaFunnelCacheEntry> => {
      const entry = sharedData.cacheManager.cacheEntries[MinaFunnelCacheEntry.SYMBOL];
      if (entry != null && entry.initialized()) return entry;

      const newEntry = new MinaFunnelCacheEntry();
      sharedData.cacheManager.cacheEntries[MinaFunnelCacheEntry.SYMBOL] = newEntry;

      const pg = postgres(config.archiveConnectionString);

      const genesisTime = await getGenesisTime(pg);

      const startingBlockTimestamp = (await sharedData.web3.eth.getBlock(startingBlockHeight))
        .timestamp as number;

      const slot = minaTimestampToSlot(
        baseChainTimestampToMina(
          startingBlockTimestamp,
          config.confirmationDepth,
          config.slotDuration
        ),
        genesisTime,
        config.slotDuration
      );

      const slotAsMinaTimestamp = slotToMinaTimestamp(slot, genesisTime, config.slotDuration);

      newEntry.updateStartingSlot(slotAsMinaTimestamp, genesisTime, pg);

      const cursors = await getPaginationCursors.run(undefined, dbTx);

      const extensions = sharedData.extensions
        .filter(extensions => extensions.network === chainName)
        .map(extension => extension.cdeId)
        .reduce((set, cdeId) => {
          set.add(cdeId);
          return set;
        }, new Set());

      cursors
        .filter(cursor => extensions.has(cursor.cde_id))
        .forEach(cursor => {
          newEntry.updateCursor(cursor.cde_id, {
            cursor: cursor.cursor,
            finished: cursor.finished,
          });
        });

      return newEntry;
    })();

    return new MinaFunnel(sharedData, dbTx, config, chainName, baseFunnel, await cacheEntry);
  }
}

export async function wrapToMinaFunnel(
  chainFunnel: ChainFunnel,
  sharedData: FunnelSharedData,
  dbTx: PoolClient,
  startingBlockHeight: number,
  chainName: string,
  config: MinaConfig
): Promise<ChainFunnel> {
  try {
    const ebp = await MinaFunnel.recoverState(
      sharedData,
      dbTx,
      chainFunnel,
      chainName,
      config,
      startingBlockHeight
    );
    return ebp;
  } catch (err) {
    doLog('[paima-funnel] Unable to initialize mina cde events processor:');
    logError(err);
    throw new Error('[paima-funnel] Unable to initialize mina cde events processor');
  }
}
