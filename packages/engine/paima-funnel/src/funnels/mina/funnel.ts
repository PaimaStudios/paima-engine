import type { EvmConfig, Web3 } from '@paima/utils';
import {
  doLog,
  initWeb3,
  logError,
  timeout,
  delay,
  InternalEventType,
  ChainDataExtensionType,
} from '@paima/utils';
import type { ChainFunnel, ReadPresyncDataFrom } from '@paima/runtime';
import type {
  ChainData,
  ChainDataExtension,
  ChainDataExtensionDatum,
  MinaPresyncChainData,
  PresyncChainData,
} from '@paima/sm';
import { getUngroupedCdeData } from '../../cde/reading.js';
import { composeChainData, groupCdeData } from '../../utils.js';
import { BaseFunnel } from '../BaseFunnel.js';
import type { FunnelSharedData } from '../BaseFunnel.js';
import type { PoolClient } from 'pg';
import { FUNNEL_PRESYNC_FINISHED, ConfigNetworkType } from '@paima/utils';
import { getCarpCursors, getLatestProcessedCdeBlockheight } from '@paima/db';
import getMinaGenericCdeData from '../../cde/minaGeneric.js';
import { MinaConfig } from '@paima/utils/src/config/loading.js';
import { MinaFunnelCacheEntry } from '../FunnelCache.js';
import { timeStamp } from 'console';

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
    .then(
      res => res['data']['genesisBlock']['protocolState']['blockchainState']['utcDate']
    )) as string;

  return Number.parseInt(genesisTime, 10);
}

const SLOT_DURATION = 3 * 60000;

function slotToTimestamp(slot: number, genesisTime: number): number {
  console.log('slot', slot, genesisTime);
  return slot * SLOT_DURATION + genesisTime;
}

function timestampToSlot(ts: number, genesisTime: number): number {
  return Math.max(Math.floor((ts - genesisTime) / SLOT_DURATION), 0);
}

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
    .then(
      res => res['data']['bestChain'][0]['protocolState']['consensusState']['slotSinceGenesis']
    );

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
    console.log('confirmedSlot', confirmedSlot);
    const confirmedTimestamp = slotToTimestamp(confirmedSlot, cachedState.genesisTime);

    const fromTimestamp =
      this.cache.getState().lastPoint?.timestamp || cachedState.startingSlotTimestamp;

    console.log('baseData', baseData);

    const toTimestamp = Math.max(
      confirmedTimestamp,
      baseData[baseData.length - 1].timestamp - 3 * 60000 * this.config.confirmationDepth
    );

    const fromSlot = timestampToSlot(fromTimestamp, cachedState.genesisTime);
    const toSlot = timestampToSlot(toTimestamp, cachedState.genesisTime);

    console.log('from slot to slot', fromSlot, toSlot);

    const mapSlotsToEvmNumbers: { [slot: number]: number } = {};

    let curr = 0;

    for (let slot = fromSlot; slot <= toSlot; slot++) {
      while (
        curr < baseData.length &&
        timestampToSlot(baseData[curr].timestamp * 1000, cachedState.genesisTime) < slot
      )
        curr++;

      if (curr < baseData.length) {
        mapSlotsToEvmNumbers[slot] = baseData[curr].blockNumber;
      }
    }

    console.log('made mapping');

    const ungroupedCdeData = await Promise.all(
      this.sharedData.extensions.reduce(
        (promises, extension) => {
          if (extension.cdeType === ChainDataExtensionType.MinaGeneric) {
            const promise = getMinaGenericCdeData(
              this.config.archive,
              extension,
              fromTimestamp,
              toTimestamp,
              ts => mapSlotsToEvmNumbers[timestampToSlot(ts, cachedState.genesisTime)],
              this.chainName
            );

            promises.push(promise);
          }

          return promises;
        },
        [] as Promise<ChainDataExtensionDatum[]>[]
      )
    );

    console.log('grouping cde data');

    const grouped = groupCdeData(
      this.chainName,
      baseData[0].blockNumber,
      baseData[baseData.length - 1].blockNumber,
      ungroupedCdeData.filter(data => data.length > 0)
    );

    console.log('composing cde data');

    const composed = composeChainData(baseData, grouped);

    return composed;
  }

  public override async readPresyncData(
    args: ReadPresyncDataFrom
  ): Promise<{ [network: string]: PresyncChainData[] | typeof FUNNEL_PRESYNC_FINISHED }> {
    const basePromise = this.baseFunnel.readPresyncData(args);

    const cache = this.cache.getState();

    const cursors = cache.cursors;

    console.log('cursors', cursors);

    if (cursors && Object.values(cursors).every(x => x.finished)) {
      const data = await basePromise;
      data[this.chainName] = FUNNEL_PRESYNC_FINISHED;

      return data;
    }

    const startingSlotTimestamp = this.cache.getState().startingSlotTimestamp;

    try {
      // doLog(`Mina funnel presync ${this.chainName}: #${fromTimestamp}-${toTimestamp}`);

      const [baseData, ungroupedCdeData] = await Promise.all([
        basePromise,
        Promise.all(
          this.sharedData.extensions
            .filter(extension => {
              if (extension.cdeType !== ChainDataExtensionType.MinaGeneric) {
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
                case ChainDataExtensionType.MinaGeneric:
                  console.log('startSlot', extension.startSlot);
                  let cursor =
                    (cursors && Number.parseInt(cursors[extension.cdeId].cursor, 10)) ||
                    slotToTimestamp(extension.startSlot, cache.genesisTime);

                  console.log('cursors', cursor);

                  let to = cursor + 10 * 60000;

                  const data = getMinaGenericCdeData(
                    this.config.archive,
                    extension,
                    cursor,
                    Math.min(to - 1, startingSlotTimestamp - 1),
                    x => timestampToSlot(x, cache.genesisTime),
                    this.chainName
                  ).then(data => {
                    this.cache.updateCursor(extension.cdeId, {
                      cursor: to.toString(),
                      finished: to >= startingSlotTimestamp,
                    });

                    // if (data.length > 0) {
                    //   data[data.length - 1].paginationCursor.finished = finished;
                    // }

                    return data;
                  });

                  return data.then(data => ({
                    cdeId: extension.cdeId,
                    cdeType: extension.cdeType,
                    data,
                  }));
                default:
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

      process.exit(1);
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

      newEntry.updateStartingSlot(
        slotToTimestamp(timestampToSlot(startingBlockTimestamp * 1000, genesisTime), genesisTime),
        genesisTime
      );

      const cursors = await getCarpCursors.run(undefined, dbTx);

      const extensions = sharedData.extensions
        .filter(extensions => (extensions.network = chainName))
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
