import type { PoolClient } from 'pg';

import {
  ChainDataExtensionDatumType,
  ENV,
  GlobalConfig,
  getPaimaL2Contract,
  initWeb3,
  validatePaimaL2ContractAddress,
} from '@paima/utils';
import { loadChainDataExtensions } from '@paima/runtime';
import type { ChainFunnel, IFunnelFactory } from '@paima/runtime';
import type { ChainData, ChainDataExtension, ChainDataExtensionDatum } from '@paima/sm';
import { wrapToEmulatedBlocksFunnel } from './funnels/emulated/utils.js';
import { BlockFunnel } from './funnels/block/funnel.js';
import type { FunnelSharedData } from './funnels/BaseFunnel.js';
import { FunnelCacheManager } from './funnels/FunnelCache.js';
import { wrapToCarpFunnel } from './funnels/carp/funnel.js';
import { wrapToParallelEvmFunnel } from './funnels/parallelEvm/funnel.js';
import { ConfigNetworkType } from '@paima/utils';
import type Web3 from 'web3';
import { wrapToMinaFunnel } from './funnels/mina/funnel.js';

export class FunnelFactory implements IFunnelFactory {
  private dirtyExtensions = false;

  private constructor(public sharedData: FunnelSharedData) {}

  public static async initialize(db: PoolClient): Promise<FunnelFactory> {
    return new FunnelFactory(await FunnelFactory.initializeSharedData(db));
  }

  public static async initializeSharedData(db: PoolClient): Promise<FunnelSharedData> {
    const configs = await GlobalConfig.getInstance();
    const [_, mainConfig] = await GlobalConfig.mainEvmConfig();

    const nodeUrl = mainConfig.chainUri;
    const paimaL2ContractAddress = mainConfig.paimaL2ContractAddress;

    validatePaimaL2ContractAddress(paimaL2ContractAddress);
    const web3 = await initWeb3(nodeUrl);
    const paimaL2Contract = getPaimaL2Contract(paimaL2ContractAddress, web3);

    const web3s = await Promise.all(
      Object.keys(configs).reduce(
        (result, network) => {
          const config = configs[network];
          if (
            config &&
            (config.type === ConfigNetworkType.EVM ||
              config.type === ConfigNetworkType.EVM_OTHER) &&
            config.chainUri
          ) {
            result.push(initWeb3(config.chainUri).then(web3 => [network, web3]));
          }

          return result;
        },
        [] as Promise<[string, Web3]>[]
      )
    );

    const [extensions, extensionsValid] = await loadChainDataExtensions(
      Object.fromEntries(web3s),
      ENV.CDE_CONFIG_PATH,
      db
    );

    return {
      web3,
      paimaL2Contract,
      extensions,
      extensionsValid,
      cacheManager: new FunnelCacheManager(),
    };
  }

  public clearCache(): void {
    return this.sharedData.cacheManager.clear();
  }

  public getExtensions(): ChainDataExtension[] {
    return this.sharedData.extensions;
  }

  public extensionsAreValid(): boolean {
    return this.sharedData.extensionsValid;
  }

  public extensionsNeedReload(): boolean {
    return this.dirtyExtensions;
  }

  async markExtensionsAsDirty(): Promise<void> {
    this.dirtyExtensions = true;
  }

  async generateFunnel(dbTx: PoolClient): Promise<ChainFunnel> {
    if (this.dirtyExtensions) {
      this.sharedData = await FunnelFactory.initializeSharedData(dbTx);
      this.dirtyExtensions = false;
    }

    // start with a base funnel
    // and wrap it with dynamic decorators as needed

    let chainFunnel: ChainFunnel = await BlockFunnel.recoverState(this.sharedData, dbTx);
    for (const [chainName, config] of await GlobalConfig.otherEvmConfig()) {
      chainFunnel = await wrapToParallelEvmFunnel(
        chainFunnel,
        this.sharedData,
        dbTx,
        ENV.START_BLOCKHEIGHT,
        chainName,
        config
      );
    }
    chainFunnel = await wrapToCarpFunnel(chainFunnel, this.sharedData, dbTx, ENV.START_BLOCKHEIGHT);
    for (const [chainName, config] of await GlobalConfig.minaConfig()) {
      chainFunnel = await wrapToMinaFunnel(
        chainFunnel,
        this.sharedData,
        dbTx,
        ENV.START_BLOCKHEIGHT,
        chainName,
        config
      );
    }
    chainFunnel = await wrapToEmulatedBlocksFunnel(
      chainFunnel,
      this.sharedData,
      dbTx,
      ENV.START_BLOCKHEIGHT,
      ENV.EMULATED_BLOCKS,
      ENV.EMULATED_BLOCKS_MAX_WAIT
    );
    return chainFunnel;
  }
}

// If we have a dynamic primitive, then technically we may have missed an
// event in the range.
//
// Here we invalidate everything after that point, so that in the next
// funnel call we start from that point.
//
// TODO: there are two possible ways of optimizing this:
//
//  1. Cache this information for the next request.
//  2. Build the dynamic contract here and get the extra data for the new extensions.
//
// First option is probably much easier to implement. Second option
// has the issue that we can't update the shared data here, so it probably would
// inovlve duplicating the logic.
export function filterResultsAfterDynamicPrimitive(
  ungroupedCdeData: ChainDataExtensionDatum[][],
  baseChainData: ChainData[],
  toBlock: number
) {
  const firstDynamicBlock = ungroupedCdeData
    .filter(
      extData =>
        extData.length > 0 &&
        extData[0].cdeDatumType === ChainDataExtensionDatumType.DynamicPrimitive
    )
    // we just get the first one, since these are sorted.
    .reduce((min, extData) => Math.min(min, extData[0].blockNumber), toBlock + 1);

  let filteredBaseChainData = baseChainData;

  if (firstDynamicBlock <= toBlock) {
    filteredBaseChainData = baseChainData.filter(ext => ext.blockNumber <= firstDynamicBlock);
  }
  return filteredBaseChainData;
}
