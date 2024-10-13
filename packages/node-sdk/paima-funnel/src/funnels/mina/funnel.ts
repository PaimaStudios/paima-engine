import {
  doLog,
  logError,
  ChainDataExtensionType,
  delay,
  ENV,
  InternalEventType,
} from '@paima/utils';
import type { ChainFunnel, FunnelJson, ReadPresyncDataFrom } from '@paima/runtime';
import type {
  ChainData,
  ChainDataExtensionDatum,
  MinaPresyncChainData,
  PaginationCursor,
  PresyncChainData,
} from '@paima/sm';
import type { ChainInfo } from '../../utils.js';
import { composeChainData, groupCdeData } from '../../utils.js';
import { BaseFunnel } from '../BaseFunnel.js';
import type { FunnelSharedData } from '../BaseFunnel.js';
import type { PoolClient } from 'pg';
import { FUNNEL_PRESYNC_FINISHED, ConfigNetworkType } from '@paima/utils';
import { getMinaCheckpoint, getPaginationCursors } from '@paima/db';
import { getActionCdeData, getEventCdeData } from '../../cde/minaGeneric.js';
import type { MinaConfig } from '@paima/utils';
import { MinaFunnelCacheEntry } from '../FunnelCache.js';
import pg from 'pg';
const { Client } = pg;

const delayForWaitingForFinalityLoop = 1000;

async function findMinaConfirmedTimestamp(
  db: pg.Client,
  confirmationDepth?: number
): Promise<number> {
  let row;
  if (confirmationDepth) {
    row = (
      await db.query(`
    WITH RECURSIVE chain AS (
      (SELECT parent_id, id, timestamp, height FROM blocks b WHERE height = (select MAX(height) from blocks)
      ORDER BY timestamp ASC
      LIMIT 1)
      UNION ALL
      SELECT b.parent_id, b.id, b.timestamp, b.height FROM blocks b
      INNER JOIN chain
      ON b.id = chain.parent_id AND chain.id <> chain.parent_id
    ) SELECT timestamp FROM chain c
    LIMIT 1
    OFFSET ${confirmationDepth};
  `)
    ).rows;
  } else {
    const res = await db.query(
      `select timestamp from blocks where chain_status = 'canonical' order by height desc limit 1;`
    );

    row = res.rows;
  }

  return Number.parseInt(row[0].timestamp as string, 10);
}

// mina timestamps are in milliseconds, while evm timestamps are in seconds.
function baseChainTimestampToMina(baseChainTimestamp: number, delay: number): number {
  return Math.max((baseChainTimestamp - delay) * 1000, 0);
}

export class MinaFunnel extends BaseFunnel implements ChainFunnel {
  chainInfo: ChainInfo<MinaConfig>;

  protected constructor(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    chainInfo: ChainInfo<MinaConfig>,
    private readonly baseFunnel: ChainFunnel,
    private cache: MinaFunnelCacheEntry
  ) {
    super(sharedData, dbTx);
    this.readData.bind(this);
    this.readPresyncData.bind(this);
    this.getDbTx.bind(this);
    this.configPrint.bind(this);
    this.chainInfo = chainInfo;
  }

  public override async readData(blockHeight: number): Promise<ChainData[]> {
    const baseData = await this.baseFunnel.readData(blockHeight);

    const caip2 = caip2PrefixFor(this.chainInfo.config);

    if (baseData.length === 0) {
      return baseData;
    }

    let cachedState = this.cache.getState();

    const maxBaseTimestamp = baseChainTimestampToMina(
      baseData[baseData.length - 1].timestamp,
      this.chainInfo.config.delay
    );

    while (true) {
      const confirmedTimestamp = await findMinaConfirmedTimestamp(
        cachedState.pg,
        this.chainInfo.config.confirmationDepth
      );

      if (confirmedTimestamp >= maxBaseTimestamp) {
        break;
      }

      await delay(delayForWaitingForFinalityLoop);
    }

    const lastRoundTimestamp = this.cache.getState().lastPoint?.timestamp;
    const fromTimestamp = lastRoundTimestamp
      ? lastRoundTimestamp + 1
      : cachedState.startingSlotTimestamp;

    const toTimestamp = maxBaseTimestamp;

    const getBlockNumber =
      (state: { curr: number }) =>
      (ts: number): number => {
        while (
          state.curr < baseData.length &&
          baseChainTimestampToMina(baseData[state.curr].timestamp, this.chainInfo.config.delay) <=
            ts
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
              caip2,
              isPresync: false,
              cursor: undefined,
              limit: this.chainInfo.config.paginationLimit,
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
              caip2,
              isPresync: false,
              cursor: undefined,
              limit: this.chainInfo.config.paginationLimit,
            });

            promises.push(promise);
          }

          return promises;
        },
        [] as Promise<ChainDataExtensionDatum[]>[]
      )
    );

    const grouped = groupCdeData(
      caip2,
      baseData[0].blockNumber,
      baseData[baseData.length - 1].blockNumber,
      ungroupedCdeData.filter(data => data.length > 0)
    );

    const composed = composeChainData(baseData, grouped);

    this.cache.updateLastPoint(toTimestamp);

    for (const chainData of composed) {
      if (!chainData.internalEvents) {
        chainData.internalEvents = [];
      }

      chainData.internalEvents.push({
        type: InternalEventType.MinaLastTimestamp,

        timestamp: baseChainTimestampToMina(
          chainData.timestamp,
          this.chainInfo.config.delay
        ).toString(),
        caip2,
      });
    }

    return composed;
  }

  public override async readPresyncData(args: ReadPresyncDataFrom): Promise<{
    [caip2: string]: PresyncChainData[] | typeof FUNNEL_PRESYNC_FINISHED;
  }> {
    const basePromise = this.baseFunnel.readPresyncData(args);

    const cache = this.cache.getState();

    const cursors = cache.cursors;

    const caip2 = caip2PrefixFor(this.chainInfo.config);
    if (cursors && Object.values(cursors).every(x => x.finished)) {
      const data = await basePromise;
      data[caip2] = FUNNEL_PRESYNC_FINISHED;

      return data;
    }

    const mapCursorPaginatedData =
      (cdeName: string) =>
      <T extends { paginationCursor: PaginationCursor }>(datums: T[]): T[] => {
        const finished =
          datums.length === 0 || datums.length < this.chainInfo.config.paginationLimit;

        this.cache.updateCursor(cdeName, {
          cursor: datums[datums.length - 1]
            ? datums[datums.length - 1].paginationCursor.cursor
            : '',
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
              if (extension.network !== this.chainInfo.name) {
                return false;
              }

              if (cursors) {
                const cursor = cursors[extension.cdeName];

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
                const cursor = cursors && cursors[extension.cdeName];

                const data = await getEventCdeData({
                  pg: cache.pg,
                  extension,
                  fromTimestamp: 0,
                  fromBlockHeight: extension.startBlockHeight,
                  toTimestamp: startingSlotTimestamp - 1,
                  // the handler for this cde stores the block height unmodified
                  // (even if the event is scheduled at the correct height), so
                  // handle this special case here, to have the events properly
                  // sorted.
                  getBlockNumber: _x => ENV.SM_START_BLOCKHEIGHT + 1,
                  caip2,
                  isPresync: true,
                  cursor: cursor?.cursor,
                  limit: this.chainInfo.config.paginationLimit,
                }).then(mapCursorPaginatedData(extension.cdeName));

                return {
                  cdeName: extension.cdeName,
                  cdeType: extension.cdeType,
                  data,
                };
              } else if (extension.cdeType === ChainDataExtensionType.MinaActionGeneric) {
                const cursor = cursors && cursors[extension.cdeName];

                const data = await getActionCdeData({
                  pg: cache.pg,
                  extension,
                  fromTimestamp: 0,
                  fromBlockHeight: extension.startBlockHeight,
                  toTimestamp: startingSlotTimestamp - 1,
                  getBlockNumber: _x => ENV.SM_START_BLOCKHEIGHT + 1,
                  caip2,
                  isPresync: true,
                  cursor: cursor?.cursor,
                  limit: this.chainInfo.config.paginationLimit,
                }).then(mapCursorPaginatedData(extension.cdeName));

                return {
                  cdeName: extension.cdeName,
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
            caip2,
            networkType: ConfigNetworkType.MINA,
            minaCursor: {
              cdeName: event.cdeName,
              cursor: event.paginationCursor.cursor,
              finished: event.paginationCursor.finished,
            },
          });
        }
      }

      baseData[caip2] = list;

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
    chainInfo: ChainInfo<MinaConfig>
  ): Promise<MinaFunnel> {
    const cacheEntry = (async (): Promise<MinaFunnelCacheEntry> => {
      const entry = sharedData.cacheManager.cacheEntries[MinaFunnelCacheEntry.SYMBOL];
      if (entry != null && entry.initialized()) return entry;

      const newEntry = new MinaFunnelCacheEntry();
      sharedData.cacheManager.cacheEntries[MinaFunnelCacheEntry.SYMBOL] = newEntry;

      const pg = new Client({ connectionString: chainInfo.config.archiveConnectionString });
      await pg.connect();

      const startingBlock = await sharedData.mainNetworkApi.getStartingBlock();

      if (!startingBlock) {
        throw new Error("Couldn't get main's network staring block timestamp");
      }

      const minaTimestamp = baseChainTimestampToMina(
        startingBlock.timestamp,
        chainInfo.config.delay
      );

      newEntry.updateStartingTimestamp(minaTimestamp, pg);

      const cursors = await getPaginationCursors.run(undefined, dbTx);

      const extensions = sharedData.extensions
        .filter(extensions => extensions.network === chainInfo.name)
        .map(extension => extension.cdeName)
        .reduce((set, cdeName) => {
          set.add(cdeName);
          return set;
        }, new Set());

      cursors
        .filter(cursor => extensions.has(cursor.cde_name))
        .forEach(cursor => {
          newEntry.updateCursor(cursor.cde_name, {
            cursor: cursor.cursor,
            finished: cursor.finished,
          });
        });

      const checkpoint = await getMinaCheckpoint.run(
        { caip2: caip2PrefixFor(chainInfo.config) },
        dbTx
      );
      if (checkpoint.length > 0) {
        newEntry.updateLastPoint(Number.parseInt(checkpoint[0].timestamp, 10));
      }

      return newEntry;
    })();

    return new MinaFunnel(sharedData, dbTx, chainInfo, baseFunnel, await cacheEntry);
  }

  public override configPrint(): FunnelJson {
    return {
      type: 'MinaFunnel',
      chainName: this.chainInfo.name,
      child: this.baseFunnel.configPrint(),
    };
  }
}

export async function wrapToMinaFunnel(
  chainFunnel: ChainFunnel,
  sharedData: FunnelSharedData,
  dbTx: PoolClient,
  chainInfo: ChainInfo<MinaConfig>
): Promise<ChainFunnel> {
  try {
    const ebp = await MinaFunnel.recoverState(sharedData, dbTx, chainFunnel, chainInfo);
    return ebp;
  } catch (err) {
    doLog('[paima-funnel] Unable to initialize mina cde events processor:');
    logError(err);
    throw new Error('[paima-funnel] Unable to initialize mina cde events processor');
  }
}
