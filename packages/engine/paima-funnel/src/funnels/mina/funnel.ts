import { doLog, logError, ChainDataExtensionType } from '@paima/utils';
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

async function getGenesisTime(graphql: string): Promise<number> {
  const genesisTime = (await fetch(graphql, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      query: `
        {
          genesisBlock {
            protocolState {
              blockchainState {
                utcDate
              }
            }
          }
        }
      `,
    }),
  })
    .then(res => res.json())
    .then(res => res.data.genesisBlock.protocolState.blockchainState.utcDate)) as string;

  return Number.parseInt(genesisTime, 10);
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

// TODO: maybe using the node's rpc here it's not really safe? if it's out of
// sync with the archive db we could end up skipping events
// it would be better to have an endpoint for this on the archive api
// either that, or the archive node api should take a block hash, and if it's
// not there it should return an error.
async function findMinaConfirmedSlot(graphql: string, confirmationDepth: number): Promise<number> {
  const body = JSON.stringify({
    query: `
        {
          bestChain(maxLength: ${confirmationDepth}) {
            stateHash
            protocolState {
              consensusState {
                blockHeight
                slotSinceGenesis
              }
              previousStateHash
            }
          }
        }
      `,
  });

  const confirmedSlot = await fetch(graphql, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
    },

    body,
  })
    .then(res => res.json())
    .then(res => res.data.bestChain[0].protocolState.consensusState.slotSinceGenesis);

  return Number.parseInt(confirmedSlot, 10);
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

    const confirmedSlot = await findMinaConfirmedSlot(
      this.config.graphql,
      this.config.confirmationDepth
    );

    const confirmedTimestamp = slotToMinaTimestamp(
      confirmedSlot,
      cachedState.genesisTime,
      this.config.slotDuration
    );

    const fromTimestamp =
      this.cache.getState().lastPoint?.timestamp || cachedState.startingSlotTimestamp;

    const toTimestamp = Math.max(
      confirmedTimestamp,
      baseChainTimestampToMina(
        baseData[baseData.length - 1].timestamp,
        this.config.confirmationDepth,
        this.config.slotDuration
      )
    );

    const fromSlot = minaTimestampToSlot(
      fromTimestamp,
      cachedState.genesisTime,
      this.config.slotDuration
    );
    const toSlot = minaTimestampToSlot(
      toTimestamp,
      cachedState.genesisTime,
      this.config.slotDuration
    );

    const mapSlotsToEvmNumbers: { [slot: number]: number } = {};

    let curr = 0;

    for (let slot = fromSlot; slot <= toSlot; slot++) {
      while (
        curr < baseData.length &&
        minaTimestampToSlot(
          baseChainTimestampToMina(
            baseData[curr].timestamp,
            this.config.confirmationDepth,
            this.config.slotDuration
          ),
          cachedState.genesisTime,
          this.config.slotDuration
        ) < slot
      )
        curr++;

      if (curr < baseData.length) {
        mapSlotsToEvmNumbers[slot] = baseData[curr].blockNumber;
      }
    }

    const ungroupedCdeData = await Promise.all(
      this.sharedData.extensions.reduce(
        (promises, extension) => {
          if (extension.cdeType === ChainDataExtensionType.MinaEventGeneric) {
            const promise = getEventCdeData(
              this.config.archive,
              extension,
              fromTimestamp,
              toTimestamp,
              ts =>
                mapSlotsToEvmNumbers[
                  minaTimestampToSlot(ts, cachedState.genesisTime, this.config.slotDuration)
                ],
              this.chainName
            );

            promises.push(promise);
          }

          if (extension.cdeType === ChainDataExtensionType.MinaActionGeneric) {
            const promise = getActionCdeData(
              this.config.archive,
              extension,
              fromTimestamp,
              toTimestamp,
              ts =>
                mapSlotsToEvmNumbers[
                  minaTimestampToSlot(ts, cachedState.genesisTime, this.config.slotDuration)
                ],
              this.chainName
            );

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
            .map(extension => {
              if (extension.cdeType === ChainDataExtensionType.MinaEventGeneric) {
                let from = slotToMinaTimestamp(
                  extension.startSlot,
                  cache.genesisTime,
                  this.config.slotDuration
                );

                const cursor = cursors && cursors[extension.cdeId];

                const data = getEventCdeData(
                  this.config.archive,
                  extension,
                  from,
                  startingSlotTimestamp - 1,
                  x => minaTimestampToSlot(x, cache.genesisTime, this.config.slotDuration),
                  this.chainName,
                  cursor?.cursor
                ).then(mapCursorPaginatedData(extension.cdeId));

                return data.then(data => ({
                  cdeId: extension.cdeId,
                  cdeType: extension.cdeType,
                  data,
                }));
              } else if (extension.cdeType === ChainDataExtensionType.MinaActionGeneric) {
                let from = slotToMinaTimestamp(
                  extension.startSlot,
                  cache.genesisTime,
                  this.config.slotDuration
                );

                const cursor = cursors && cursors[extension.cdeId];

                const data = getActionCdeData(
                  this.config.archive,
                  extension,
                  from,
                  startingSlotTimestamp - 1,
                  x => minaTimestampToSlot(x, cache.genesisTime, this.config.slotDuration),
                  this.chainName,
                  cursor?.cursor
                ).then(mapCursorPaginatedData(extension.cdeId));

                return data.then(data => ({
                  cdeId: extension.cdeId,
                  cdeType: extension.cdeType,
                  data,
                }));
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

      const genesisTime = await getGenesisTime(config.graphql);

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

      newEntry.updateStartingSlot(slotAsMinaTimestamp, genesisTime);

      const cursors = await getPaginationCursors.run(undefined, dbTx);

      const extensions = sharedData.extensions
        .filter(extensions => extensions.network === chainName)
        .map(extension => extension.cdeId);

      for (const cursor of cursors) {
        // TODO: performance concern? but not likely
        if (extensions.find(cdeId => cdeId === cursor.cde_id))
          newEntry.updateCursor(cursor.cde_id, {
            cursor: cursor.cursor,
            finished: cursor.finished,
          });
      }

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
