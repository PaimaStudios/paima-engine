import type { AvailConfig } from '@paima/utils';
import { caip2PrefixFor, doLog, timeout } from '@paima/utils';
import type { ChainFunnel, ReadPresyncDataFrom } from '@paima/runtime';
import { type ChainData, type PresyncChainData } from '@paima/sm';
import { BaseFunnel } from '../BaseFunnel.js';
import type { FunnelSharedData } from '../BaseFunnel.js';
import { RpcCacheEntry, RpcRequestState } from '../FunnelCache.js';
import type { PoolClient } from 'pg';
import { FUNNEL_PRESYNC_FINISHED } from '@paima/utils';
import { createApi } from './createApi.js';
import type { ApiPromise } from 'avail-js-sdk';
import {
  GET_DATA_TIMEOUT,
  getDAData,
  getLatestAvailableBlockNumberFromLightClient,
  getMultipleHeaderData,
  slotToTimestamp,
} from './utils.js';
import { processDataUnit } from '../../paima-l2-processing.js';

export class AvailBlockFunnel extends BaseFunnel implements ChainFunnel {
  config: AvailConfig;
  chainName: string;
  api: ApiPromise;

  protected constructor(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    config: AvailConfig,
    chainName: string,
    api: ApiPromise
  ) {
    super(sharedData, dbTx);
    // TODO: replace once TS5 decorators are better supported
    this.readData.bind(this);
    this.readPresyncData.bind(this);
    this.getDbTx.bind(this);
    this.config = config;
    this.chainName = chainName;
    this.api = api;
  }

  public override async readData(blockHeight: number): Promise<ChainData[]> {
    const [fromBlock, toBlock] = await this.adjustBlockHeightRange(
      blockHeight,
      this.config.funnelBlockGroupSize
    );

    if (fromBlock < 0 || toBlock < fromBlock) {
      return [];
    }

    if (toBlock === fromBlock) {
      doLog(`Avail block funnel ${this.chainName}: #${toBlock}`);
    } else {
      doLog(`Avail block funnel ${this.chainName}: #${fromBlock}-${toBlock}`);
    }

    return await this.internalReadData(fromBlock, toBlock);
  }

  /**
   * Will return [-1, -2] if the range is determined to be empty.
   * It should be enough to check that fromBlock >= 0,
   * but this will also fail a fromBlock <= toBlock check.
   */
  private adjustBlockHeightRange = async (
    firstBlockHeight: number,
    blockCount: number
  ): Promise<[number, number]> => {
    const ERR_RESULT: [number, number] = [-1, -2];

    const latestBlockQueryState = this.sharedData.cacheManager.cacheEntries[
      RpcCacheEntry.SYMBOL
    ]?.getState(this.chainName);
    if (latestBlockQueryState?.state !== RpcRequestState.HasResult) {
      throw new Error(`[funnel] latest block cache entry not found`);
    }

    const fromBlock = Math.max(0, firstBlockHeight);
    const toBlock = Math.min(latestBlockQueryState.result, firstBlockHeight + blockCount - 1);

    if (fromBlock <= toBlock) {
      return [fromBlock, toBlock];
    } else {
      return ERR_RESULT;
    }
  };

  private internalReadData = async (fromBlock: number, toBlock: number): Promise<ChainData[]> => {
    if (toBlock < fromBlock || fromBlock < 0) {
      return [];
    }

    const numbers = Array.from(
      { length: toBlock - fromBlock + 1 },
      (_, index) => fromBlock + index
    );

    const parallelHeaders = await timeout(
      getMultipleHeaderData(this.api, numbers),
      GET_DATA_TIMEOUT
    );

    const data = [];
    const submittedData = await timeout(
      getDAData(this.api, this.config.lightClient, fromBlock, toBlock, caip2PrefixFor(this.config)),
      GET_DATA_TIMEOUT
    );

    for (const header of parallelHeaders) {
      const blockData = submittedData.find(bd => bd.blockNumber === header.number);
      const blockTimestamp = slotToTimestamp(header.slot, this.api);

      const mappedSubmittedData = [];

      if (blockData?.submittedData) {
        const processed = await Promise.all(
          blockData.submittedData.map(unit =>
            processDataUnit(
              unit,
              blockData.blockNumber,
              slotToTimestamp(header.slot, this.api),
              this.dbTx
            )
          )
        );

        for (const data of processed) {
          mappedSubmittedData.push(...data);
        }
      }

      data.push({
        blockNumber: header.number,
        timestamp: blockTimestamp,
        blockHash: header.hash,
        submittedData: mappedSubmittedData,
      });
    }

    return data;
  };

  public override async readPresyncData(
    args: ReadPresyncDataFrom
  ): Promise<{ [network: string]: PresyncChainData[] | typeof FUNNEL_PRESYNC_FINISHED }> {
    let arg = args.find(arg => arg.network == this.chainName);

    const chainName = this.chainName;

    if (!arg) {
      return {};
    } else {
      return { [chainName]: FUNNEL_PRESYNC_FINISHED };
    }
  }

  public static async recoverState(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    chainName: string,
    config: AvailConfig
  ): Promise<AvailBlockFunnel> {
    const api = await createApi(config.rpc);

    const latestBlock = await getLatestAvailableBlockNumberFromLightClient(config.lightClient);

    const cacheEntry = ((): RpcCacheEntry => {
      const entry = sharedData.cacheManager.cacheEntries[RpcCacheEntry.SYMBOL];
      if (entry != null) return entry;

      const newEntry = new RpcCacheEntry();
      sharedData.cacheManager.cacheEntries[RpcCacheEntry.SYMBOL] = newEntry;
      return newEntry;
    })();

    cacheEntry.updateState(chainName, latestBlock);

    return new AvailBlockFunnel(sharedData, dbTx, config, chainName, api);
  }
}
