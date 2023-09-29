import type { MetaMaskInpageProvider } from '@metamask/providers';
import type { ActiveConnection, GameInfo, IConnector, IProvider, UserSignature } from './IProvider';
import { utf8ToHex } from 'web3-utils';
import { ProviderApiError, ProviderNotInitialized, WalletNotFound } from './errors';

declare global {
  interface Window {
    ethereum: MetaMaskInpageProvider;
    // API should be the same as MetaMask
    evmproviders?: Record<string, MetaMaskInpageProvider>;
  }
}

/**
 * Type definition from EIP3085 (https://eips.ethereum.org/EIPS/eip-3085)
 * I couldn't find this part of any NPM library for some reason
 */
interface AddEthereumChainParameter {
  chainId: string;
  blockExplorerUrls?: string[];
  chainName?: string;
  iconUrls?: string[];
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls?: string[];
}

export type EvmApi = MetaMaskInpageProvider;
export type EvmAddress = string;

/**
 * NOTE: https://eips.ethereum.org/EIPS/eip-5749
 */

// TODO: this should probably be dynamically detected
enum SupportedEvmWallets {
  Metamask = 'metamask',
  Flint = 'flint',
}

const getProvider = (name: string): MetaMaskInpageProvider => {
  switch (name) {
    case 'metamask':
      return window.ethereum;
    default: {
      if (window.evmproviders != null && name in window.evmproviders) {
        return window.evmproviders[name];
      }
      throw new WalletNotFound(`EVM wallet ${name} not found`);
    }
  }
};

export class EvmConnector implements IConnector<EvmApi> {
  private provider: EvmProvider | undefined;
  private static INSTANCE: undefined | EvmConnector = undefined;

  static instance(): EvmConnector {
    if (EvmConnector.INSTANCE == null) {
      const newInstance = new EvmConnector();
      EvmConnector.INSTANCE = newInstance;
    }
    return EvmConnector.INSTANCE;
  }
  connectSimple = async (gameInfo: GameInfo): Promise<EvmProvider> => {
    if (this.provider != null) {
      return this.provider;
    }
    // TODO: probably this should be better
    return await this.connectNamed(gameInfo, SupportedEvmWallets.Metamask);
  };
  connectExternal = async (
    gameInfo: GameInfo,
    conn: ActiveConnection<EvmApi>
  ): Promise<EvmProvider> => {
    this.provider = await EvmProvider.init(gameInfo, conn);

    // Update the selected Eth address if the user changes after logging in.
    // warning: not supported by all wallets (ex: Flint)
    window.ethereum.on('accountsChanged', newAccounts => {
      const accounts = newAccounts as string[];
      if (!accounts || !accounts[0] || accounts[0] !== this.provider?.address) {
        this.provider = undefined;
      }
    });
    return this.provider;
  };
  connectNamed = async (gameInfo: GameInfo, name: string): Promise<EvmProvider> => {
    if (this.provider?.getConnection().metadata?.name === name) {
      return this.provider;
    }

    return await this.connectExternal(gameInfo, {
      metadata: {
        name,
      },
      api: getProvider(name),
    });
  };
  getProvider = (): undefined | EvmProvider => {
    return this.provider;
  };
  getOrThrowProvider = (): EvmProvider => {
    if (this.provider == null) {
      throw new ProviderNotInitialized(`EvmConnector not initialized yet`);
    }
    return this.provider;
  };
  isConnected = (): boolean => {
    return this.provider != null;
  };
}

export class EvmProvider implements IProvider<EvmApi> {
  constructor(
    private readonly conn: ActiveConnection<EvmApi>,
    private readonly gameInfo: GameInfo,
    readonly address: EvmAddress
  ) {}
  static init = async (
    gameInfo: GameInfo,
    conn: ActiveConnection<EvmApi>
  ): Promise<EvmProvider> => {
    const accounts = (await conn.api.request({
      method: 'eth_requestAccounts',
    })) as string[];
    if (!accounts || accounts.length === 0) {
      throw new ProviderApiError('Unknown error while receiving EVM accounts');
    }

    return new EvmProvider(conn, gameInfo, accounts[0]);
  };
  getConnection = (): ActiveConnection<EvmApi> => {
    return this.conn;
  };
  getAddress = (): string => {
    return this.address;
  };
  signMessage = async (message: string): Promise<UserSignature> => {
    const hexMessage = utf8ToHex(message);
    const signature = await this.conn.api.request({
      method: 'personal_sign',
      params: [hexMessage, this.getAddress(), ''],
    });
    if (typeof signature !== 'string') {
      console.log('[signMessageEth] invalid signature:', signature);
      throw new ProviderApiError(`[signMessageEth] Received signature of type ${typeof signature}`);
    }
    return signature;
  };
  verifyWalletChain = async (): Promise<boolean> => {
    if (this.gameInfo.gameChainId == null) {
      throw new ProviderApiError(
        `[verifyWalletChain] cannot use a function that requires a chain ID when no chain ID was set`
      );
    }
    try {
      const walletChain = await this.conn.api.request({ method: 'eth_chainId' });
      return parseInt(walletChain as string, 16) === parseInt(this.gameInfo.gameChainId, 16);
    } catch (e: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      throw new ProviderApiError(`[verifyWalletChain] error: ${e?.message}`, e?.code);
    }
  };
  addChain = async (newChain: AddEthereumChainParameter): Promise<void> => {
    try {
      await this.conn.api.request({
        method: 'wallet_addEthereumChain',
        params: [newChain],
      });
    } catch (e: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      throw new ProviderApiError(`[addChain] error: ${e?.message}`, e?.code);
    }
  };
  switchChain = async (hexChainId: string): Promise<void> => {
    try {
      await this.conn.api.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (e: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      throw new ProviderApiError(`[switchChain] error: ${e?.message}`, e?.code);
    }
  };
  sendTransaction = async (tx: Record<string, any>): Promise<string> => {
    await this.verifyWalletChain();
    try {
      const hash = await this.conn.api.request({
        method: 'eth_sendTransaction',
        params: [tx],
      });
      if (typeof hash !== 'string') {
        console.log('[sendTransaction] invalid signature:', hash);
        throw new ProviderApiError(`[sendTransaction] Received "hash" of type ${typeof hash}`);
      }
      return hash;
    } catch (e: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      throw new ProviderApiError(`[sendTransaction] error: ${e?.message}`, e?.code);
    }
  };
}
