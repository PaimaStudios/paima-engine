import type { MetaMaskInpageProvider } from '@metamask/providers';
import {
  optionToActive,
  type ActiveConnection,
  type ConnectionOption,
  type GameInfo,
  type IConnector,
  type IProvider,
  type UserSignature,
} from './IProvider';
import { utf8ToHex } from 'web3-utils';
import { ProviderApiError, ProviderNotInitialized, WalletNotFound } from './errors';

type EIP1193Provider = MetaMaskInpageProvider;

interface EIP5749ProviderInfo {
  uuid: string;
  name: string;
  icon: `data:image/svg+xml;base64,${string}`;
  description: string;
}
interface EIP5749ProviderWithInfo extends EIP1193Provider {
  info: EIP5749ProviderInfo;
}
interface EIP5749EVMProviders {
  /**
   * The key is RECOMMENDED to be the name of the extension in snake_case. It MUST contain only lowercase letters, numbers, and underscores.
   */
  [index: string]: EIP5749ProviderWithInfo;
}

interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}
interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}
interface EIP6963AnnounceProviderEvent extends CustomEvent {
  type: 'eip6963:announceProvider';
  detail: EIP6963ProviderDetail;
}

const eip5953Providers: EIP6963ProviderDetail[] = [];

window?.addEventListener('eip6963:announceProvider', (event: EIP6963AnnounceProviderEvent) => {
  eip5953Providers.push(event.detail);
});
window?.dispatchEvent(new Event('eip6963:requestProvider'));
declare global {
  interface Window {
    ethereum?: EIP1193Provider;
    evmproviders?: EIP5749EVMProviders;
  }
  interface WindowEventMap {
    'eip6963:announceProvider': EIP6963AnnounceProviderEvent;
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

export type EvmApi = EIP1193Provider;
export type EvmAddress = string;

export class EvmConnector implements IConnector<EvmApi> {
  private provider: EvmProvider | undefined;
  private static INSTANCE: undefined | EvmConnector = undefined;

  static getWalletOptions(): ConnectionOption<EvmApi>[] {
    const seenNames: Set<string> = new Set();
    const allWallets: ConnectionOption<EvmApi>[] = [];

    // add options and de-duplicate based off the display name
    // we can't duplicate on other keys because they have a different formats for different EIPs
    const addOptions: (options: ConnectionOption<EvmApi>[]) => void = options => {
      for (const option of options) {
        if (seenNames.has(option.metadata.name)) continue;
        seenNames.add(option.metadata.name);
        allWallets.push(option);
      }
    };

    // 1) Add EIP6963 and prioritize it for deduplicating
    {
      const eip6963Options = eip5953Providers.map(({ info, provider }) => ({
        metadata: {
          name: info.rdns,
          displayName: info.name,
          icon: info.icon,
        },
        api: () => Promise.resolve(provider),
      }));
      addOptions(eip6963Options);
    }

    // 2) Add EIP5749
    {
      const eip5749Options = Object.entries(window.evmproviders ?? {}).map(([key, provider]) => ({
        metadata: {
          name: key,
          displayName: provider.info.name,
          icon: provider.info.icon,
        },
        api: () => Promise.resolve(provider),
      }));
      addOptions(eip5749Options);
    }

    // Metamask doesn't support EIP6963 yet, but it plans to. In the meantime, we add it manually
    if (window.ethereum != null && window.ethereum.isMetaMask) {
      const ethereum = window.ethereum;
      addOptions([
        {
          metadata: {
            name: 'metamask',
            displayName: 'Metamask',
          },
          api: () => Promise.resolve(ethereum),
        },
      ]);
    }
    return allWallets;
  }
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
    const options = EvmConnector.getWalletOptions();
    if (options.length === 0) {
      throw new WalletNotFound(`No EVM wallet found`);
    }
    return await this.connectExternal(gameInfo, await optionToActive(options[0]));
  };
  connectExternal = async (
    gameInfo: GameInfo,
    conn: ActiveConnection<EvmApi>
  ): Promise<EvmProvider> => {
    if (this.provider?.getConnection().metadata?.name === conn.metadata.name) {
      return this.provider;
    }
    this.provider = await EvmProvider.init(gameInfo, conn);

    // Update the selected Eth address if the user changes after logging in.
    // warning: not supported by all wallets (ex: Flint)
    window.ethereum?.on('accountsChanged', newAccounts => {
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

    const provider = EvmConnector.getWalletOptions().find(entry => entry.metadata.name === name);
    if (provider == null) {
      throw new WalletNotFound(`EVM wallet ${name} not found`);
    }
    return await this.connectExternal(gameInfo, await optionToActive(provider));
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
