import { FunnelConfigBuilder } from '../src/config/FunnelConfig.js';
import {
  checkEventExists,
  ConfigBuilder,
  ConfigFunnelType,
  ConfigNetworkType,
  ConfigPrimitiveType,
} from '../src/index.js';
import { erc20Abi } from 'viem';
import { ConfigFunnelDecoratorType } from '../src/schema/funnel/decorators/types.js';

const deployedEvmAddresses = {
  PaimaL2Contract: '',
  SomeFactory: '',
} as const;
const stfInputs = {
  tokenTransfer: 'mock',
};

export const mainnetConfig = new ConfigBuilder({
  securityNamespace: 'my-game',
})
  .addNetwork({
    displayName: 'Ethereum',
    type: ConfigNetworkType.EVM,
    rpcUrls: {
      default: ['http://localhost:8545'],
    },
    chainId: 1,
    nativeCurrency: {
      name: 'Test Hardhat Tokens',
      symbol: 'TEST',
      decimals: 18,
    },
  })
  .addNetwork({
    displayName: 'Ethereum2',
    type: ConfigNetworkType.EVM,
    rpcUrls: {
      default: ['http://localhost:8545'],
    },
    chainId: 2,
    nativeCurrency: {
      name: 'Test Hardhat Tokens',
      symbol: 'TEST',
      decimals: 18,
    },
  })
  .addNetwork({
    displayName: 'Avail',
    type: ConfigNetworkType.AVAIL,
    genesisHash: '000000000000000000000000000000000000000000000000000000000000000000',
  })
  .registerDeployedContracts({
    network: config => config.data.networks.Ethereum,
    deployments: (_config, _network) => deployedEvmAddresses,
  })
  .registerDeployedContracts({
    network: config => config.data.networks.Ethereum2,
    deployments: (_config, _network) => deployedEvmAddresses,
  })
  .addFunnels({
    funnels: config =>
      new FunnelConfigBuilder(config.data)
        .addMainFunnel({
          network: config => config.networks.Ethereum,
          funnel: (config, network) => ({
            displayName: 'EvmMainFunnel',
            type: ConfigFunnelType.EVM_MAIN,
            chainUri: network.rpcUrls.default[0],
            blockTime: 2,
            paimaL2ContractAddress:
              config.deployedAddresses[network.displayName]['PaimaL2Contract'],
          }),
        })
        .addParallelFunnel({
          network: config => config.networks.Ethereum2,
          funnel: (config, network) => ({
            displayName: 'EvmParallelFunnel',
            type: ConfigFunnelType.EVM_PARALLEL,
            chainUri: network.rpcUrls.default[0],
            blockTime: 2,
            confirmationDepth: 2,
          }),
        })
        .wrapWith({
          funnel: (config, topFunnel) => ({
            displayName: 'EvmDecoratorFunnel',
            type: ConfigFunnelDecoratorType.EMULATED,
            blockTimeMs: 1000,
          }),
        })
        // this is just to test that wrapping twice works
        .wrapWith({
          funnel: (config, topFunnel) => ({
            displayName: 'EvmDecoratorFunnel2',
            type: ConfigFunnelDecoratorType.EMULATED,
            blockTimeMs: 1000,
          }),
        })
        .build(),
  })
  .addPrimitive({
    funnel: (config, flattenedFunnels) => flattenedFunnels.EvmMainFunnel,
    primitive: (config, network, _funnel) => ({
      displayName: 'TransferEvent',
      type: ConfigPrimitiveType.Generic,

      startBlockHeight: 0,
      contractAddress: config.data.deployedAddresses[network.displayName]['SomeFactory'],
      // TODO: it might be better to combine abi & eventSignature into a single function call
      //       that way, we can remove the unnecessary fields from the ABI to keep the object small
      abi: erc20Abi,
      eventSignature: checkEventExists(erc20Abi, 'Transfer(address,address,uint256)'),
      scheduledPrefix: stfInputs.tokenTransfer,
    }),
  })
  .addPrimitive({
    funnel: (config, flattenedFunnels) => flattenedFunnels.EvmParallelFunnel,
    primitive: (config, network, _funnel) => ({
      displayName: 'TransferEvent2',
      type: ConfigPrimitiveType.Generic,

      startBlockHeight: 0,
      contractAddress: config.data.deployedAddresses[network.displayName]['SomeFactory'],
      abi: erc20Abi,
      eventSignature: checkEventExists(erc20Abi, 'Transfer(address,address,uint256)'),
      scheduledPrefix: stfInputs.tokenTransfer,
    }),
  });
