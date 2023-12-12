import type { PoolClient } from 'pg';

import { ENV, getPaimaL2Contract, initWeb3, validatePaimaL2ContractAddress } from '@paima/utils';
import { loadChainDataExtensions } from '@paima/runtime';
import type { ChainFunnel, IFunnelFactory } from '@paima/runtime';
import type { ChainDataExtension } from '@paima/sm';
import { wrapToEmulatedBlocksFunnel } from './funnels/emulated/utils.js';
import { BlockFunnel } from './funnels/block/funnel.js';
import type { FunnelSharedData } from './funnels/BaseFunnel.js';
import { FunnelCacheManager } from './funnels/FunnelCache.js';
import { wrapToCarpFunnel } from './funnels/carp/funnel.js';

export class FunnelFactory implements IFunnelFactory {
  private constructor(public sharedData: FunnelSharedData) {}

  public static async initialize(
    nodeUrl: string,
    paimaL2ContractAddress: string
  ): Promise<FunnelFactory> {
    validatePaimaL2ContractAddress(paimaL2ContractAddress);
    const web3 = await initWeb3(nodeUrl);
    const paimaL2Contract = getPaimaL2Contract(paimaL2ContractAddress, web3);
    const [extensions, extensionsValid] = await loadChainDataExtensions(web3, ENV.CDE_CONFIG_PATH);

    return new FunnelFactory({
      web3,
      paimaL2Contract,
      extensions,
      extensionsValid,
      cacheManager: new FunnelCacheManager(),
    });
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

  async generateFunnel(dbTx: PoolClient): Promise<ChainFunnel> {
    // start with a base funnel
    // and wrap it with dynamic decorators as needed

    let chainFunnel: ChainFunnel = await BlockFunnel.recoverState(this.sharedData, dbTx);
    chainFunnel = await wrapToCarpFunnel(
      chainFunnel,
      this.sharedData,
      dbTx,
      ENV.CARP_URL,
      ENV.START_BLOCKHEIGHT
    );
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
