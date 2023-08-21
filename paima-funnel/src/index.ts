import type { Pool } from 'pg';

import { ENV, getPaimaL2Contract, initWeb3, validatePaimaL2ContractAddress } from '@paima/utils';
import { loadChainDataExtensions } from '@paima/runtime';
import type { ChainFunnel } from '@paima/runtime';
import { wrapToEmulatedBlocksFunnel } from './funnels/emulated/utils.js';
import { BlockFunnel } from './funnels/block/funnel.js';
import type { FunnelSharedData } from './funnels/BaseFunnel.js';

const paimaFunnelInitializer = {
  async initialize(
    nodeUrl: string,
    paimaL2ContractAddress: string,
    DBConn: Pool
  ): Promise<ChainFunnel> {
    validatePaimaL2ContractAddress(paimaL2ContractAddress);
    const web3 = await initWeb3(nodeUrl);
    const paimaL2Contract = getPaimaL2Contract(paimaL2ContractAddress, web3);
    const [extensions, extensionsValid] = await loadChainDataExtensions(web3, ENV.CDE_CONFIG_PATH);

    const sharedData: FunnelSharedData = {
      web3,
      paimaL2Contract,
      extensions,
      extensionsValid,
      latestAvailableBlockNumber: 0,
    };

    // start with a base funnel
    // and wrap it with dynamic decorators as needed

    let chainFunnel: ChainFunnel = new BlockFunnel(sharedData);
    chainFunnel = await wrapToEmulatedBlocksFunnel(
      chainFunnel,
      sharedData,
      DBConn,
      ENV.START_BLOCKHEIGHT,
      ENV.EMULATED_BLOCKS,
      ENV.EMULATED_BLOCKS_MAX_WAIT
    );
    return chainFunnel;
  },
};

export default paimaFunnelInitializer;
