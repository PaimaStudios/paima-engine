import type { EvmConfig } from '@paima/utils';
import {
  ChainDataExtensionType,
  ENV,
  GlobalConfig,
  doLog,
  getErc721Contract,
  timeout,
} from '@paima/utils';
import type { ChainFunnel, ReadPresyncDataFrom } from '@paima/runtime';
import type { CdeDynamicPrimitiveDatum, ChainDataExtensionDatum } from '@paima/sm';
import { CdeEntryTypeName, type ChainData, type PresyncChainData } from '@paima/sm';
import { getBaseChainDataMulti, getBaseChainDataSingle } from '../../reading.js';
import { getUngroupedCdeData } from '../../cde/reading.js';
import { composeChainData, groupCdeData } from '../../utils.js';
import { BaseFunnel } from '../BaseFunnel.js';
import type { FunnelSharedData } from '../BaseFunnel.js';
import { RpcCacheEntry, RpcRequestState } from '../FunnelCache.js';
import type { PoolClient } from 'pg';
import { FUNNEL_PRESYNC_FINISHED } from '@paima/utils';

const GET_BLOCK_NUMBER_TIMEOUT = 5000;

export class BlockFunnel extends BaseFunnel implements ChainFunnel {
  config: EvmConfig;
  chainName: string;

  protected constructor(
    sharedData: FunnelSharedData,
    dbTx: PoolClient,
    config: EvmConfig,
    chainName: string
  ) {
    super(sharedData, dbTx);
    // TODO: replace once TS5 decorators are better supported
    this.readData.bind(this);
    this.readPresyncData.bind(this);
    this.getDbTx.bind(this);
    this.config = config;
    this.chainName = chainName;
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
      doLog(`Block funnel ${this.config.chainId}: #${toBlock}`);
      return await this.internalReadDataSingle(fromBlock);
    } else {
      doLog(`Block funnel ${this.config.chainId}: #${fromBlock}-${toBlock}`);
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

    const latestBlockQueryState = this.sharedData.cacheManager.cacheEntries[
      RpcCacheEntry.SYMBOL
    ]?.getState(this.config.chainId);
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
    try {
      const dynamicPrimitives = await this.fetchDynamicPrimitives(blockNumber, blockNumber);

      const [baseChainData, cdeData] = await Promise.all([
        getBaseChainDataSingle(
          this.sharedData.web3,
          this.sharedData.paimaL2Contract,
          blockNumber,
          this.dbTx,
          this.chainName
        ),
        getUngroupedCdeData(
          this.sharedData.web3,
          this.sharedData.extensions.filter(
            extension =>
              extension.network === this.chainName &&
              // these are fetched above
              extension.cdeType !== ChainDataExtensionType.DynamicPrimitive
          ),
          blockNumber,
          blockNumber,
          this.chainName
        ),
      ]);

      return [
        {
          ...baseChainData,
          extensionDatums: cdeData.concat(dynamicPrimitives).flat(),
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
    try {
      const dynamicPrimitives = await this.fetchDynamicPrimitives(fromBlock, toBlock);

      const [baseChainData, ungroupedCdeData] = await Promise.all([
        getBaseChainDataMulti(
          this.sharedData.web3,
          this.sharedData.paimaL2Contract,
          fromBlock,
          toBlock,
          this.dbTx,
          this.chainName
        ),
        getUngroupedCdeData(
          this.sharedData.web3,
          this.sharedData.extensions.filter(
            extension =>
              extension.network === this.chainName &&
              // these are fetched above
              extension.cdeType !== ChainDataExtensionType.DynamicPrimitive
          ),
          fromBlock,
          toBlock,
          this.chainName
        ),
      ]);

      ungroupedCdeData.push(...dynamicPrimitives);

      const cdeData = groupCdeData(this.chainName, fromBlock, toBlock, ungroupedCdeData);
      return composeChainData(baseChainData, cdeData);
    } catch (err) {
      doLog(`[funnel] at ${fromBlock}-${toBlock} caught ${err}`);
      throw err;
    }
  };

  public override async readPresyncData(
    args: ReadPresyncDataFrom
  ): Promise<{ [network: string]: PresyncChainData[] | typeof FUNNEL_PRESYNC_FINISHED }> {
    let arg = args.find(arg => arg.network == this.chainName);

    if (!arg) {
      return {};
    }

    let fromBlock = arg.from;
    let toBlock = arg.to;

    if (fromBlock >= ENV.START_BLOCKHEIGHT) {
      return { [this.chainName]: FUNNEL_PRESYNC_FINISHED };
    }

    try {
      toBlock = Math.min(toBlock, ENV.START_BLOCKHEIGHT);
      fromBlock = Math.max(fromBlock, 0);
      if (fromBlock > toBlock) {
        return {};
      }

      const dynamicDatums = await this.fetchDynamicPrimitives(fromBlock, toBlock);

      const ungroupedCdeData = (
        await getUngroupedCdeData(
          this.sharedData.web3,
          this.sharedData.extensions.filter(extension => extension.network === this.chainName),
          fromBlock,
          toBlock,
          this.chainName
        )
      ).concat(dynamicDatums);

      return {
        [this.chainName]: groupCdeData(this.chainName, fromBlock, toBlock, ungroupedCdeData),
      };
    } catch (err) {
      doLog(`[paima-funnel::readPresyncData] Exception occurred while reading blocks: ${err}`);
      throw err;
    }
  }

  private async fetchDynamicPrimitives(
    fromBlock: number,
    toBlock: number
  ): Promise<ChainDataExtensionDatum[][]> {
    const dynamicPrimitives = await getUngroupedCdeData(
      this.sharedData.web3,
      this.sharedData.extensions.filter(
        extension =>
          extension.network === this.chainName &&
          extension.cdeType === ChainDataExtensionType.DynamicPrimitive
      ),
      fromBlock,
      toBlock,
      this.chainName
    );

    for (const exts of dynamicPrimitives) {
      for (const _ext of exts) {
        const ext: CdeDynamicPrimitiveDatum = _ext as CdeDynamicPrimitiveDatum;
        // this would propagate the change to further funnels in the pipeline,
        // which is needed to set the proper cdeId.
        this.sharedData.extensions.push({
          name: '',
          startBlockHeight: ext.blockNumber,
          type: CdeEntryTypeName.ERC721,
          contractAddress: ext.payload.contractAddress,
          scheduledPrefix: ext.scheduledPrefix,
          burnScheduledPrefix: ext.scheduledPrefix,
          cdeId: this.sharedData.extensions.length,
          network: this.chainName,
          // not relevant
          hash: 0,
          cdeType: ChainDataExtensionType.ERC721,
          contract: getErc721Contract(ext.payload.contractAddress, this.sharedData.web3),
        });
      }
    }

    return dynamicPrimitives;
  }

  public static async recoverState(
    sharedData: FunnelSharedData,
    dbTx: PoolClient
  ): Promise<BlockFunnel> {
    // we always write to this cache instead of reading from it
    // as other funnels used may want to read from this cached data

    const latestBlock: number = await timeout(
      sharedData.web3.eth.getBlockNumber(),
      GET_BLOCK_NUMBER_TIMEOUT
    );
    const cacheEntry = ((): RpcCacheEntry => {
      const entry = sharedData.cacheManager.cacheEntries[RpcCacheEntry.SYMBOL];
      if (entry != null) return entry;

      const newEntry = new RpcCacheEntry();
      sharedData.cacheManager.cacheEntries[RpcCacheEntry.SYMBOL] = newEntry;
      return newEntry;
    })();

    const [chainName, config] = await GlobalConfig.mainEvmConfig();

    cacheEntry.updateState(config.chainId, latestBlock);

    return new BlockFunnel(sharedData, dbTx, config, chainName);
  }
}
