import type { PoolClient } from 'pg';
import { ENV, GlobalConfig, getPaimaL2Contract, initWeb3 } from '@paima/utils';
import { loadChainDataExtensions } from '@paima/runtime';
import type { ChainFunnel, IFunnelFactory } from '@paima/runtime';
import type { ChainDataExtension } from '@paima/sm';
import { wrapToEmulatedBlocksFunnel } from './funnels/emulated/utils.js';
import { BlockFunnel } from './funnels/block/funnel.js';
import { BaseFunnelSharedApi, type FunnelSharedData } from './funnels/BaseFunnel.js';
import { FunnelCacheManager } from './funnels/FunnelCache.js';
import { wrapToCarpFunnel } from './funnels/carp/funnel.js';
import { wrapToParallelEvmFunnel } from './funnels/parallelEvm/funnel.js';
import { wrapToAvailParallelFunnel } from './funnels/avail/parallelFunnel.js';
import { ConfigNetworkType } from '@paima/utils';
import type Web3 from 'web3';
import { wrapToMinaFunnel } from './funnels/mina/funnel.js';
import { AvailBlockFunnel } from './funnels/avail/baseFunnel.js';
import { AvailSharedApi } from './funnels/avail/utils.js';

export class Web3SharedApi extends BaseFunnelSharedApi {
  public constructor(protected web3: Web3) {
    super();
    this.getBlock.bind(this);
  }

  public override async getBlock(
    height: number
  ): Promise<{ timestamp: number | string } | undefined> {
    const block = await this.web3.eth.getBlock(height);

    return block;
  }
}

export class FunnelFactory implements IFunnelFactory {
  private constructor(public sharedData: FunnelSharedData) {}

  public static async initialize(db: PoolClient): Promise<FunnelFactory> {
    const configs = await GlobalConfig.getInstance();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, mainConfig] = await GlobalConfig.mainConfig();

    let mainNetworkApi;

    if (mainConfig.type === ConfigNetworkType.EVM) {
      const nodeUrl = mainConfig.chainUri;
      const web3 = await initWeb3(nodeUrl);

      mainNetworkApi = new Web3SharedApi(web3);
    }

    if (mainConfig.type === ConfigNetworkType.AVAIL_MAIN) {
      mainNetworkApi = new AvailSharedApi(mainConfig.rpc);
    }

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

    if (!mainNetworkApi) {
      throw new Error("Failed to initialize main's network shared api");
    }

    return new FunnelFactory({
      mainNetworkApi,
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
    let chainFunnel: ChainFunnel | undefined;

    const [chainName, config] = await GlobalConfig.mainConfig();

    if (config.type === ConfigNetworkType.EVM) {
      const web3 = await initWeb3(config.chainUri);
      const paimaL2Contract = getPaimaL2Contract(config.paimaL2ContractAddress, web3);

      chainFunnel = await BlockFunnel.recoverState(
        this.sharedData,
        dbTx,
        chainName,
        config,
        web3,
        paimaL2Contract
      );
    }

    if (config.type === ConfigNetworkType.AVAIL_MAIN) {
      chainFunnel = await AvailBlockFunnel.recoverState(this.sharedData, dbTx, chainName, config);
    }

    if (!chainFunnel) {
      throw new Error('No configuration found for the main network');
    }

    for (const [chainName, config] of await GlobalConfig.otherEvmConfig()) {
      chainFunnel = await wrapToParallelEvmFunnel(
        chainFunnel,
        this.sharedData,
        dbTx,
        chainName,
        config
      );
    }
    chainFunnel = await wrapToCarpFunnel(chainFunnel, this.sharedData, dbTx, ENV.START_BLOCKHEIGHT);
    for (const [chainName, config] of await GlobalConfig.minaConfig()) {
      chainFunnel = await wrapToMinaFunnel(chainFunnel, this.sharedData, dbTx, chainName, config);
    }

    for (const [chainName, config] of await GlobalConfig.otherAvailConfig()) {
      chainFunnel = await wrapToAvailParallelFunnel(
        chainFunnel,
        this.sharedData,
        dbTx,
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
