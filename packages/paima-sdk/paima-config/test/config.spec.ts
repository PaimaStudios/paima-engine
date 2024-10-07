import { describe, expect, test } from 'vitest';
// eslint-disable-next-line require-extensions/require-index
import {
  checkEventExists,
  ConfigBuilder,
  ConfigFunnelType,
  ConfigNetworkType,
  ConfigPrimitiveType,
} from '../src';
import { erc20Abi } from 'viem';

const deployedEvmAddresses = {
  PaimaL2Contract: '',
  SomeFactory: '',
} as const;
const stfInputs = {
  tokenTransfer: 'mock',
};

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/dot-notation */

export const mainnetConfig = new ConfigBuilder()
  .addNetwork({
    displayName: 'Ethereum',
    type: ConfigNetworkType.EVM,
    chainUri: 'http://localhost:8545',
    chainId: 1,
    chainCurrencyName: 'Test Hardhat Tokens',
    chainCurrencySymbol: 'TEST',
    chainCurrencyDecimals: 18,
  })
  .addNetwork({
    displayName: 'Ethereum2',
    type: ConfigNetworkType.EVM,
    chainUri: 'http://localhost:8545',
    chainId: 2,
    chainCurrencyName: 'Test Hardhat Tokens',
    chainCurrencySymbol: 'TEST',
    chainCurrencyDecimals: 18,
  })
  .registerDeployedContracts({
    network: config => config.networks.Ethereum,
    deployments: (_config, _network) => deployedEvmAddresses,
  })
  .registerDeployedContracts({
    network: config => config.networks.Ethereum2,
    deployments: (_config, _network) => deployedEvmAddresses,
  })
  .addFunnel({
    network: config => config.networks.Ethereum,
    funnel: (config, network) => ({
      displayName: 'MainFunnel',
      type: ConfigFunnelType.EVM_MAIN,
      chainUri: network.chainUri,
      blockTime: 2,
      paimaL2ContractAddress: config.deployedAddresses[network.displayName]['PaimaL2Contract'],
    }),
  })
  .addFunnel({
    network: config => config.networks.Ethereum2,
    funnel: (config, network) => ({
      displayName: 'MainFunnel2',
      type: ConfigFunnelType.EVM_MAIN,
      chainUri: network.chainUri,
      blockTime: 2,
      paimaL2ContractAddress: config.deployedAddresses[network.displayName]['PaimaL2Contract'],
    }),
  })
  .addPrimitive({
    funnel: config => config.funnels.MainFunnel,
    primitive: (config, network, _funnel) => ({
      displayName: 'TransferEvent',
      type: ConfigPrimitiveType.Generic,

      startBlockHeight: 0,
      contractAddress: config.deployedAddresses[network.displayName]['SomeFactory'],
      abi: erc20Abi,
      eventSignature: checkEventExists(erc20Abi, 'Transfer(address,address,uint256)'),
      scheduledPrefix: stfInputs.tokenTransfer,
    })})
    .addPrimitive({
      funnel: config => config.funnels.MainFunnel2,
      primitive: (config, network, _funnel) => ({
        displayName: 'TransferEvent2',
        type: ConfigPrimitiveType.Generic,
  
        startBlockHeight: 0,
        contractAddress: config.deployedAddresses[network.displayName]['SomeFactory'],
        abi: erc20Abi,
        eventSignature: checkEventExists(erc20Abi, 'Transfer(address,address,uint256)'),
        scheduledPrefix: stfInputs.tokenTransfer,
      })}
  );

describe('config', () => {
  test('should work', () => {
    expect(mainnetConfig.exportConfig()).toEqual({
      networks: {
        Ethereum: {
          displayName: 'Ethereum',
          type: 'evm',
          chainUri: 'http://localhost:8545',
          chainId: 1,
          chainCurrencyName: 'Test Hardhat Tokens',
          chainCurrencySymbol: 'TEST',
          chainCurrencyDecimals: 18,
        },
        Ethereum2: {
          displayName: 'Ethereum2',
          type: 'evm',
          chainUri: 'http://localhost:8545',
          chainId: 2,
          chainCurrencyName: 'Test Hardhat Tokens',
          chainCurrencySymbol: 'TEST',
          chainCurrencyDecimals: 18,
        },
      },
      deployedAddresses: {
        Ethereum: { PaimaL2Contract: '', SomeFactory: '' },
        Ethereum2: { PaimaL2Contract: '', SomeFactory: '' },
      },
      funnels: {
        MainFunnel: {
          network: 'Ethereum',
          config: {
            displayName: 'MainFunnel',
            type: 'evm-main',
            chainUri: 'http://localhost:8545',
            blockTime: 2,
            paimaL2ContractAddress: '',
          },
        },
        MainFunnel2: {
          network: 'Ethereum2',
          config: {
            displayName: 'MainFunnel2',
            type: 'evm-main',
            chainUri: 'http://localhost:8545',
            blockTime: 2,
            paimaL2ContractAddress: '',
          },
        },
      },
      primitives: {
        TransferEvent: {
          funnel: 'MainFunnel',
          primitive: {
            displayName: 'TransferEvent',
            type: 'generic',
            startBlockHeight: 0,
            contractAddress: '',
            abi: erc20Abi,
            eventSignature: 'Transfer(address,address,uint256)',
            scheduledPrefix: 'mock',
          },
        },
        TransferEvent2: {
          funnel: 'MainFunnel2',
          primitive: {
            displayName: 'TransferEvent2',
            type: 'generic',
            startBlockHeight: 0,
            contractAddress: '',
            abi: erc20Abi,
            eventSignature: 'Transfer(address,address,uint256)',
            scheduledPrefix: 'mock',
          },
        },
      },
    });
  });
});
