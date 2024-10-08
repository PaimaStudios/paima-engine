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
  .registerDeployedContracts(config => ({
    network: config.networks.Ethereum,
    deployments: deployedEvmAddresses,
  }))
  .addFunnel(config => ({
    network: config.networks.Ethereum,
    funnel: network => ({
      displayName: 'MainFunnel',
      type: ConfigFunnelType.EVM_MAIN,
      chainUri: network.chainUri,
      blockTime: 2,
      paimaL2ContractAddress: config.deployedAddresses[network.displayName]['PaimaL2Contract'],
    }),
  }))
  .addPrimitive(
    config => config.funnels.MainFunnel,
    (config, network, _funnel) => ({
      displayName: 'TransferEvent',
      type: ConfigPrimitiveType.Generic,

      startBlockHeight: 0,
      contractAddress: config.deployedAddresses[network.displayName]['SomeFactory'],
      abi: erc20Abi,
      eventSignature: checkEventExists(erc20Abi, 'Transfer(address,address,uint256)'),
      scheduledPrefix: stfInputs.tokenTransfer,
    })
  );

describe('config', () => {
  test('should work', () => {
    expect(mainnetConfig.toJson()).toEqual({
      network: {
        Ethereum: {
          displayName: 'Ethereum',
          type: 'evm',
          chainUri: 'http://localhost:8545',
          chainId: 1,
          chainCurrencyName: 'Test Hardhat Tokens',
          chainCurrencySymbol: 'TEST',
          chainCurrencyDecimals: 18,
        },
      },
      deployedAddresses: { Ethereum: { PaimaL2Contract: '', SomeFactory: '' } },
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
      },
      primitives: {
        TransferEvent: {
          funnel: 'MainFunnel',
          primitive: {
            displayName: 'TransferEvent',
            type: 'generic',
            startBlockHeight: 0,
            contractAddress: '',
            abi: [
              {
                type: 'event',
                name: 'Approval',
                inputs: [
                  { indexed: true, name: 'owner', type: 'address' },
                  { indexed: true, name: 'spender', type: 'address' },
                  { indexed: false, name: 'value', type: 'uint256' },
                ],
              },
              {
                type: 'event',
                name: 'Transfer',
                inputs: [
                  { indexed: true, name: 'from', type: 'address' },
                  { indexed: true, name: 'to', type: 'address' },
                  { indexed: false, name: 'value', type: 'uint256' },
                ],
              },
              {
                type: 'function',
                name: 'allowance',
                stateMutability: 'view',
                inputs: [
                  { name: 'owner', type: 'address' },
                  { name: 'spender', type: 'address' },
                ],
                outputs: [{ type: 'uint256' }],
              },
              {
                type: 'function',
                name: 'approve',
                stateMutability: 'nonpayable',
                inputs: [
                  { name: 'spender', type: 'address' },
                  { name: 'amount', type: 'uint256' },
                ],
                outputs: [{ type: 'bool' }],
              },
              {
                type: 'function',
                name: 'balanceOf',
                stateMutability: 'view',
                inputs: [{ name: 'account', type: 'address' }],
                outputs: [{ type: 'uint256' }],
              },
              {
                type: 'function',
                name: 'decimals',
                stateMutability: 'view',
                inputs: [],
                outputs: [{ type: 'uint8' }],
              },
              {
                type: 'function',
                name: 'name',
                stateMutability: 'view',
                inputs: [],
                outputs: [{ type: 'string' }],
              },
              {
                type: 'function',
                name: 'symbol',
                stateMutability: 'view',
                inputs: [],
                outputs: [{ type: 'string' }],
              },
              {
                type: 'function',
                name: 'totalSupply',
                stateMutability: 'view',
                inputs: [],
                outputs: [{ type: 'uint256' }],
              },
              {
                type: 'function',
                name: 'transfer',
                stateMutability: 'nonpayable',
                inputs: [
                  { name: 'recipient', type: 'address' },
                  { name: 'amount', type: 'uint256' },
                ],
                outputs: [{ type: 'bool' }],
              },
              {
                type: 'function',
                name: 'transferFrom',
                stateMutability: 'nonpayable',
                inputs: [
                  { name: 'sender', type: 'address' },
                  { name: 'recipient', type: 'address' },
                  { name: 'amount', type: 'uint256' },
                ],
                outputs: [{ type: 'bool' }],
              },
            ],
            eventSignature: 'Transfer(address,address,uint256)',
            scheduledPrefix: 'mock',
          },
        },
      },
    });
  });
});
