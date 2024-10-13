import { describe, expect, test } from 'vitest';
import { erc20Abi } from 'viem';
import { mainnetConfig } from './data.js';
import { ConfigFunnelType, FunnelConfigQuery } from '../src/index.js';

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/dot-notation */

describe('config', () => {
  test('export works as expected', () => {
    expect(mainnetConfig.exportConfig()).toEqual({
      networks: {
        Ethereum: {
          displayName: 'Ethereum',
          type: 'evm',
          rpcUrls: {
            default: ['http://localhost:8545'],
          },
          chainId: 1,
          nativeCurrency: {
            name: 'Test Hardhat Tokens',
            symbol: 'TEST',
            decimals: 18,
          },
        },
        Ethereum2: {
          displayName: 'Ethereum2',
          type: 'evm',
          rpcUrls: {
            default: ['http://localhost:8545'],
          },
          chainId: 2,
          nativeCurrency: {
            name: 'Test Hardhat Tokens',
            symbol: 'TEST',
            decimals: 18,
          },
        },
        Avail: {
          displayName: 'Avail',
          type: 'avail',
          genesisHash: '000000000000000000000000000000000000000000000000000000000000000000',
        },
      },
      deployedAddresses: {
        Ethereum: {
          PaimaL2Contract: '',
          SomeFactory: '',
        },
        Ethereum2: {
          PaimaL2Contract: '',
          SomeFactory: '',
        },
      },
      funnels: {
        EvmDecoratorFunnel2: {
          children: {
            EvmDecoratorFunnel: {
              children: {
                EvmMainFunnel: {
                  network: 'Ethereum',
                  config: {
                    displayName: 'EvmMainFunnel',
                    type: 'evm-rpc-main',
                    chainUri: 'http://localhost:8545',
                    blockTime: 2,
                    paimaL2ContractAddress: '',
                  },
                  children: {
                    EvmParallelFunnel: {
                      network: 'Ethereum2',
                      config: {
                        displayName: 'EvmParallelFunnel',
                        type: 'evm-rpc-parallel',
                        chainUri: 'http://localhost:8545',
                        blockTime: 2,
                        confirmationDepth: 2,
                      },
                    },
                  },
                },
              },
              config: {
                blockTimeMs: 1000,
                displayName: 'EvmDecoratorFunnel',
                type: 'emulated',
              },
              network: undefined,
            },
          },
          config: {
            blockTimeMs: 1000,
            displayName: 'EvmDecoratorFunnel2',
            type: 'emulated',
          },
        },
        network: undefined,
      },
      primitives: {
        TransferEvent: {
          funnel: 'EvmMainFunnel',
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
          funnel: 'EvmParallelFunnel',
          primitive: {
            displayName: 'TransferEvent2',
            type: 'generic',
            startBlockHeight: 0,
            contractAddress: '',
            abi: [
              {
                type: 'event',
                name: 'Approval',
                inputs: [
                  {
                    indexed: true,
                    name: 'owner',
                    type: 'address',
                  },
                  {
                    indexed: true,
                    name: 'spender',
                    type: 'address',
                  },
                  {
                    indexed: false,
                    name: 'value',
                    type: 'uint256',
                  },
                ],
              },
              {
                type: 'event',
                name: 'Transfer',
                inputs: [
                  {
                    indexed: true,
                    name: 'from',
                    type: 'address',
                  },
                  {
                    indexed: true,
                    name: 'to',
                    type: 'address',
                  },
                  {
                    indexed: false,
                    name: 'value',
                    type: 'uint256',
                  },
                ],
              },
              {
                type: 'function',
                name: 'allowance',
                stateMutability: 'view',
                inputs: [
                  {
                    name: 'owner',
                    type: 'address',
                  },
                  {
                    name: 'spender',
                    type: 'address',
                  },
                ],
                outputs: [
                  {
                    type: 'uint256',
                  },
                ],
              },
              {
                type: 'function',
                name: 'approve',
                stateMutability: 'nonpayable',
                inputs: [
                  {
                    name: 'spender',
                    type: 'address',
                  },
                  {
                    name: 'amount',
                    type: 'uint256',
                  },
                ],
                outputs: [
                  {
                    type: 'bool',
                  },
                ],
              },
              {
                type: 'function',
                name: 'balanceOf',
                stateMutability: 'view',
                inputs: [
                  {
                    name: 'account',
                    type: 'address',
                  },
                ],
                outputs: [
                  {
                    type: 'uint256',
                  },
                ],
              },
              {
                type: 'function',
                name: 'decimals',
                stateMutability: 'view',
                inputs: [],
                outputs: [
                  {
                    type: 'uint8',
                  },
                ],
              },
              {
                type: 'function',
                name: 'name',
                stateMutability: 'view',
                inputs: [],
                outputs: [
                  {
                    type: 'string',
                  },
                ],
              },
              {
                type: 'function',
                name: 'symbol',
                stateMutability: 'view',
                inputs: [],
                outputs: [
                  {
                    type: 'string',
                  },
                ],
              },
              {
                type: 'function',
                name: 'totalSupply',
                stateMutability: 'view',
                inputs: [],
                outputs: [
                  {
                    type: 'uint256',
                  },
                ],
              },
              {
                type: 'function',
                name: 'transfer',
                stateMutability: 'nonpayable',
                inputs: [
                  {
                    name: 'recipient',
                    type: 'address',
                  },
                  {
                    name: 'amount',
                    type: 'uint256',
                  },
                ],
                outputs: [
                  {
                    type: 'bool',
                  },
                ],
              },
              {
                type: 'function',
                name: 'transferFrom',
                stateMutability: 'nonpayable',
                inputs: [
                  {
                    name: 'sender',
                    type: 'address',
                  },
                  {
                    name: 'recipient',
                    type: 'address',
                  },
                  {
                    name: 'amount',
                    type: 'uint256',
                  },
                ],
                outputs: [
                  {
                    type: 'bool',
                  },
                ],
              },
            ],
            eventSignature: 'Transfer(address,address,uint256)',
            scheduledPrefix: 'mock',
          },
        },
      },
      securityNamespace: 'my-game',
    });
  });

  test('funnel config query works as expected', () => {
    expect(
      new FunnelConfigQuery(mainnetConfig.data.funnels).queryFunnelType.getSingleConfig(
        ConfigFunnelType.EVM_PARALLEL
      )
    ).toEqual({
      displayName: 'EvmParallelFunnel',
      type: 'evm-rpc-parallel',
      network: 'Ethereum2',
      chainUri: 'http://localhost:8545',
      blockTime: 2,
      confirmationDepth: 2,
    });
  });
});
