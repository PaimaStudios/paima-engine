import type { AvailMainConfig } from '@paima/utils';
import { caip2PrefixFor, doLog, timeout } from '@paima/utils';
import type { ChainFunnel, FunnelJson, ReadPresyncDataFrom } from '@paima/runtime';
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
import type { ChainInfo } from '../../utils.js';

export class AvailBlockFunnel extends BaseFunnel implements ChainFunnel {
  chainInfo: ChainInfo<AvailMainConfig>;
  api: ApiPromise;

  protected constructor(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    chainInfo: ChainInfo<AvailMainConfig>,
    api: ApiPromise
  ) {
    super(sharedData, dbTx);
    // TODO: replace once TS5 decorators are better supported
    this.readData.bind(this);
    this.readPresyncData.bind(this);
    this.getDbTx.bind(this);
    this.configPrint.bind(this);
    this.chainInfo = chainInfo;
    this.api = api;
  }

  public override async readData(blockHeight: number): Promise<ChainData[]> {
    const [fromBlock, toBlock] = await this.adjustBlockHeightRange(
      blockHeight,
      this.chainInfo.config.funnelBlockGroupSize
    );

    if (fromBlock < 0 || toBlock < fromBlock) {
      return [];
    }

    if (toBlock === fromBlock) {
      doLog(`Avail block funnel ${this.chainInfo.name}: #${toBlock}`);
    } else {
      doLog(`Avail block funnel ${this.chainInfo.name}: #${fromBlock}-${toBlock}`);
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
    ]?.getState(caip2PrefixFor(this.chainInfo.config));
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
      getDAData(
        this.api,
        this.chainInfo.config.lightClient,
        fromBlock,
        toBlock,
        caip2PrefixFor(this.chainInfo.config)
      ),
      GET_DATA_TIMEOUT
    );

    for (const header of parallelHeaders) {
      const blockData = submittedData.find(bd => bd.blockNumber === header.number);
      const blockTimestamp = slotToTimestamp(header.slot, this.api);

      const mappedSubmittedData = [];

      if (blockData?.submittedData) {
        const processed = await Promise.all(
          blockData.submittedData.map(unit =>
            processDataUnit(unit, blockData.blockNumber, slotToTimestamp(header.slot, this.api))
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
  ): Promise<{ [caip2: string]: PresyncChainData[] | typeof FUNNEL_PRESYNC_FINISHED }> {
    const caip2 = caip2PrefixFor(this.chainInfo.config);
    let arg = args.find(arg => arg.caip2 == caip2);

    if (!arg) {
      return {};
    } else {
      return { [caip2]: FUNNEL_PRESYNC_FINISHED };
    }
  }

  public static async recoverState(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    chainInfo: ChainInfo<AvailMainConfig>
  ): Promise<AvailBlockFunnel> {
    const api = await createApi(chainInfo.config.rpc);

    const latestBlock = await getLatestAvailableBlockNumberFromLightClient(
      chainInfo.config.lightClient
    );

    const cacheEntry = ((): RpcCacheEntry => {
      const entry = sharedData.cacheManager.cacheEntries[RpcCacheEntry.SYMBOL];
      if (entry != null) return entry;

      const newEntry = new RpcCacheEntry();
      sharedData.cacheManager.cacheEntries[RpcCacheEntry.SYMBOL] = newEntry;
      return newEntry;
    })();

    cacheEntry.updateState(caip2PrefixFor(chainInfo.config), latestBlock);

    return new AvailBlockFunnel(sharedData, dbTx, chainInfo, api);
  }

  public override configPrint(): FunnelJson {
    return {
      type: 'AvailBlockFunnel',
      chainName: this.chainInfo.name,
    };
  }
}
