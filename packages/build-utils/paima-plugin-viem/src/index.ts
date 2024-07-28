import type { Chain, ChainFormatters, PublicClient, WalletClient } from 'viem';
import { defineChain, createPublicClient, createWalletClient, custom, http } from 'viem';
import { WalletMode, WalletModeMap } from '@paima/providers';
import { privateKeyToAccount } from 'viem/accounts';

/**
 * Creates a custom Viem chain definition for the network you're deploying to
 * This is useful if the chain you're deploying to isn't part of the ones built into Viem
 * https://viem.sh/docs/chains/introduction
 *
 * Typically this function is called using `process.env` as the input
 * If your frontend system can't access the env variables for Paima,
 *    you can instead use this function in your middleware and export the result for your frontend
 *
 * @param env process.env
 * @param chain any overrides for the defaults set by this library
 * @returns viem chain definition
 */
export function genChainDefinition<
  formatters extends ChainFormatters,
  const chain extends Chain<formatters>,
>(env: Record<string, string>, chain?: Partial<chain>): ReturnType<typeof defineChain> {
  const tryGetEnv = (key: string): string => {
    if (env[key] == null) {
      throw new Error(`genChainDefinition: missing ENV variable ${key}`);
    }
    return env[key];
  };
  // TODO: this needs to be migrated to use config.NETWORK.yml
  return defineChain({
    id: Number.parseInt(tryGetEnv('CHAIN_ID'), 10),
    name: tryGetEnv('CHAIN_NAME'),
    nativeCurrency: {
      decimals: Number.parseInt(tryGetEnv('CHAIN_CURRENCY_DECIMALS'), 10),
      name: tryGetEnv('CHAIN_CURRENCY_NAME'),
      symbol: tryGetEnv('CHAIN_CURRENCY_SYMBOL'),
    },
    rpcUrls: {
      default: {
        http: [tryGetEnv('CHAIN_URI')],
      },
    },
    blockExplorers: {
      default: { name: 'Explorer', url: tryGetEnv('CHAIN_EXPLORER_URI') },
    },
    ...(chain ?? {}),
  });
}

export function getHttpClient(chain: ReturnType<typeof defineChain>): PublicClient {
  return createPublicClient({
    chain,
    transport: http(),
  });
}
export function getInjectedWallet(chain: ReturnType<typeof defineChain>): WalletClient {
  const provider = WalletModeMap[WalletMode.EvmInjected].getOrThrowProvider();
  return createWalletClient({
    account: provider.address as `0x${string}`,
    chain,
    transport: custom(provider.getConnection().api),
  });
}
export function getEthersWallet(chain: ReturnType<typeof defineChain>): WalletClient {
  const provider = WalletModeMap[WalletMode.EvmEthers].getOrThrowProvider();
  return createWalletClient({
    account: privateKeyToAccount(provider.getConnection().api),
    chain,
    transport: http(),
  });
}
