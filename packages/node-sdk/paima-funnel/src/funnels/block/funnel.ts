import type { EvmConfig, MainEvmConfig, PaimaL2Contract, Web3 } from '@paima/utils';
import { ChainDataExtensionType, ENV, caip2PrefixFor, doLog, timeout } from '@paima/utils';
import type { ChainFunnel, FunnelJson, ReadPresyncDataFrom } from '@paima/runtime';
import { type ChainData, type PresyncChainData } from '@paima/sm';
import {
  fetchDynamicEvmPrimitives,
  getBaseChainDataMulti,
  getBaseChainDataSingle,
} from '../../reading.js';
import { getUngroupedCdeData } from '../../cde/reading.js';
import { composeChainData, groupCdeData, groupEvmCdeData } from '../../utils.js';
import type { ChainInfo } from '../../utils.js';
import { BaseFunnel } from '../BaseFunnel.js';
import type { FunnelSharedData } from '../BaseFunnel.js';
import { RpcCacheEntry, RpcRequestState } from '../FunnelCache.js';
import type { PoolClient } from 'pg';
import { FUNNEL_PRESYNC_FINISHED } from '@paima/utils';

const GET_BLOCK_NUMBER_TIMEOUT = 5000;

export class BlockFunnel extends BaseFunnel implements ChainFunnel {
  chainInfo: ChainInfo<EvmConfig>;

  protected constructor(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    chainInfo: ChainInfo<EvmConfig>,
    readonly web3: Web3,
    readonly paimaL2Contract: PaimaL2Contract
  ) {
    super(sharedData, dbTx);
    // TODO: replace once TS5 decorators are better supported
    this.readData.bind(this);
    this.readPresyncData.bind(this);
    this.getDbTx.bind(this);
    this.configPrint.bind(this);
    this.chainInfo = chainInfo;
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
      doLog(`Block funnel ${this.chainInfo.config.chainId}: #${toBlock}`);
      return await this.internalReadDataSingle(fromBlock);
    } else {
      doLog(`Block funnel ${this.chainInfo.config.chainId}: #${fromBlock}-${toBlock}`);
      return await this.internalReadDataMulti(fromBlock, toBlock);
    }
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

    const caip2 = caip2PrefixFor(this.chainInfo.config);
    const latestBlockQueryState =
      this.sharedData.cacheManager.cacheEntries[RpcCacheEntry.SYMBOL]?.getState(caip2);
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

  private internalReadDataSingle = async (blockNumber: number): Promise<ChainData[]> => {
    if (blockNumber < 0) {
      return [];
    }
    const caip2 = caip2PrefixFor(this.chainInfo.config);
    try {
      const dynamicDatums = await fetchDynamicEvmPrimitives(
        blockNumber,
        blockNumber,
        this.web3,
        this.sharedData,
        this.chainInfo
      );

      const [baseChainData, cdeData] = await Promise.all([
        getBaseChainDataSingle(this.web3, this.paimaL2Contract, blockNumber, this.dbTx, caip2),
        getUngroupedCdeData(
          this.web3,
          this.sharedData.extensions.filter(
            extension =>
              extension.network === this.chainInfo.name &&
              // these are fetched above
              extension.cdeType !== ChainDataExtensionType.DynamicEvmPrimitive
          ),
          blockNumber,
          blockNumber,
          caip2
        ),
      ]);

      return [
        {
          ...baseChainData,
          extensionDatums: cdeData.concat(dynamicDatums).flat(),
        },
      ];
    } catch (err) {
      doLog(`[funnel] at ${blockNumber} caught ${err}`);
      throw err;
    }
  };

  private internalReadDataMulti = async (
    fromBlock: number,
    toBlock: number
  ): Promise<ChainData[]> => {
    if (toBlock < fromBlock || fromBlock < 0) {
      return [];
    }
    const caip2 = caip2PrefixFor(this.chainInfo.config);
    try {
      const dynamicDatums = await fetchDynamicEvmPrimitives(
        fromBlock,
        toBlock,
        this.web3,
        this.sharedData,
        this.chainInfo
      );

      const [baseChainData, ungroupedCdeData] = await Promise.all([
        getBaseChainDataMulti(
          this.web3,
          this.paimaL2Contract,
          fromBlock,
          toBlock,
          this.dbTx,
          caip2
        ),
        getUngroupedCdeData(
          this.web3,
          this.sharedData.extensions.filter(
            extension =>
              extension.network === this.chainInfo.name &&
              // these are fetched above
              extension.cdeType !== ChainDataExtensionType.DynamicEvmPrimitive
          ),
          fromBlock,
          toBlock,
          caip2
        ),
      ]);

      ungroupedCdeData.push(...dynamicDatums);

      const cdeData = groupEvmCdeData(caip2, fromBlock, toBlock, ungroupedCdeData);
      return composeChainData(baseChainData, cdeData);
    } catch (err) {
      doLog(`[funnel] at ${fromBlock}-${toBlock} caught ${err}`);
      throw err;
    }
  };

  public override async readPresyncData(
    args: ReadPresyncDataFrom
  ): Promise<{ [caip2: string]: PresyncChainData[] | typeof FUNNEL_PRESYNC_FINISHED }> {
    const caip2 = caip2PrefixFor(this.chainInfo.config);
    let arg = args.find(arg => arg.caip2 == caip2);

    if (!arg) {
      return {};
    }

    let fromBlock = arg.from;
    let toBlock = arg.to;

    if (fromBlock >= ENV.START_BLOCKHEIGHT) {
      return { [caip2]: FUNNEL_PRESYNC_FINISHED };
    }

    try {
      toBlock = Math.min(toBlock, ENV.START_BLOCKHEIGHT);
      fromBlock = Math.max(fromBlock, 0);
      if (fromBlock > toBlock) {
        return {};
      }

      const dynamicDatums = await fetchDynamicEvmPrimitives(
        fromBlock,
        toBlock,
        this.web3,
        this.sharedData,
        this.chainInfo
      );

      const ungroupedCdeData = (
        await getUngroupedCdeData(
          this.web3,
          this.sharedData.extensions.filter(
            extension =>
              extension.network === this.chainInfo.name &&
              // these are fetched above
              extension.cdeType !== ChainDataExtensionType.DynamicEvmPrimitive
          ),
          fromBlock,
          toBlock,
          caip2
        )
      ).concat(dynamicDatums);

      return {
        [caip2]: groupEvmCdeData(caip2, fromBlock, toBlock, ungroupedCdeData),
      };
    } catch (err) {
      doLog(`[paima-funnel::readPresyncData] Exception occurred while reading blocks: ${err}`);
      throw err;
    }
  }

  public static async recoverState(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    chainInfo: ChainInfo<MainEvmConfig>,
    web3: Web3,
    paimaL2Contract: PaimaL2Contract
  ): Promise<BlockFunnel> {
    // we always write to this cache instead of reading from it
    // as other funnels used may want to read from this cached data

    const latestBlock: number = await timeout(web3.eth.getBlockNumber(), GET_BLOCK_NUMBER_TIMEOUT);
    const cacheEntry = ((): RpcCacheEntry => {
      const entry = sharedData.cacheManager.cacheEntries[RpcCacheEntry.SYMBOL];
      if (entry != null) return entry;

      const newEntry = new RpcCacheEntry();
      sharedData.cacheManager.cacheEntries[RpcCacheEntry.SYMBOL] = newEntry;
      return newEntry;
    })();

    const caip2 = caip2PrefixFor(chainInfo.config);
    cacheEntry.updateState(caip2, latestBlock);

    return new BlockFunnel(sharedData, dbTx, chainInfo, web3, paimaL2Contract);
  }

  public override configPrint(): FunnelJson {
    return {
      type: 'BlockFunnel',
      chainName: this.chainInfo.name,
    };
  }
}
