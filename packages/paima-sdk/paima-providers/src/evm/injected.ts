import type { MetaMaskInpageProvider } from '@metamask/providers';
import type {
  ActiveConnection,
  ConnectionOption,
  GameInfo,
  IConnector,
  IProvider,
  UserSignature,
  AddressAndType,
} from '../IProvider.js';
import { optionToActive } from '../IProvider.js';
import { utf8ToHex } from 'web3-utils';
import { ProviderApiError, ProviderNotInitialized, WalletNotFound } from '../errors.js';
import type { EvmAddress } from './types.js';
import { AddressType } from '@paima/utils';
import { getWindow } from '../window.js';

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

getWindow()?.addEventListener('eip6963:announceProvider', (event: EIP6963AnnounceProviderEvent) => {
  eip5953Providers.push(event.detail);
});
getWindow()?.dispatchEvent(new Event('eip6963:requestProvider'));
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

export class EvmInjectedConnector implements IConnector<EvmApi> {
  private provider: EvmInjectedProvider | undefined;
  private static INSTANCE: undefined | EvmInjectedConnector = undefined;

  /**
   * Wallets may inject themselves using multiple competing standards
   * We have to track all of them (with duplicates) internally
   * To make sure `connectNamed` calls properly find wallets no matter the name used
   */
  static getPossiblyDuplicateWalletOptions(): ConnectionOption<EvmApi>[] {
    const allWallets: ConnectionOption<EvmApi>[] = [];

    const windowObj = getWindow();
    if (windowObj == null) return [];

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
      allWallets.push(...eip6963Options);
    }

    // 2) Add EIP5749
    {
      const eip5749Options = Object.entries(windowObj.evmproviders ?? {}).map(
        ([key, provider]) => ({
          metadata: {
            name: key,
            displayName: provider.info.name,
            icon: provider.info.icon,
          },
          api: () => Promise.resolve(provider),
        })
      );
      allWallets.push(...eip5749Options);
    }

    // Metamask doesn't support EIP6963 yet, but it plans to. In the meantime, we add it manually
    if (windowObj.ethereum != null && windowObj.ethereum.isMetaMask) {
      const ethereum = windowObj.ethereum;
      allWallets.push({
        metadata: {
          name: 'metamask',
          displayName: 'MetaMask',
        },
        api: () => Promise.resolve(ethereum),
      });
    }
    // some wallets aggressively put themselves in the list of wallets the user has installed
    // even if the user has never actually used these
    // we put these wallets at the bottom of the priority
    const aggressiveWallets = ['com.brave.wallet'];
    allWallets.sort((a, b) => {
      const aAggressive = aggressiveWallets.includes(a.metadata.name);
      const bAggressive = aggressiveWallets.includes(b.metadata.name);
      if (aAggressive && !bAggressive) return 1;
      if (bAggressive && !aAggressive) return -1;
      return 0;
    });
    return allWallets;
  }
  static getWalletOptions(): ConnectionOption<EvmApi>[] {
    const withDuplicates = EvmInjectedConnector.getPossiblyDuplicateWalletOptions();
    const seenNames: Set<string> = new Set();
    const seenDisplayNames: Set<string> = new Set();

    const result: ConnectionOption<EvmApi>[] = [];
    for (const option of withDuplicates) {
      const lowerCaseName = option.metadata.displayName.toLowerCase();
      if (seenNames.has(option.metadata.name)) continue;
      if (seenDisplayNames.has(lowerCaseName)) continue;
      seenNames.add(option.metadata.name);
      seenDisplayNames.add(lowerCaseName);
      result.push(option);
    }

    return result;
  }

  static instance(): EvmInjectedConnector {
    if (EvmInjectedConnector.INSTANCE == null) {
      const newInstance = new EvmInjectedConnector();
      EvmInjectedConnector.INSTANCE = newInstance;
    }
    return EvmInjectedConnector.INSTANCE;
  }
  connectSimple = async (gameInfo: GameInfo): Promise<EvmInjectedProvider> => {
    if (this.provider != null) {
      return this.provider;
    }
    const options = EvmInjectedConnector.getWalletOptions();
    if (options.length === 0) {
      throw new WalletNotFound(`No EVM wallet found`);
    }
    return await this.connectExternal(gameInfo, await optionToActive(options[0]));
  };
  connectExternal = async (
    gameInfo: GameInfo,
    conn: ActiveConnection<EvmApi>
  ): Promise<EvmInjectedProvider> => {
    if (this.provider?.getConnection().metadata?.name === conn.metadata.name) {
      return this.provider;
    }
    this.provider = await EvmInjectedProvider.init(gameInfo, conn);

    // Update the selected Eth address if the user changes after logging in.
    // warning: not supported by all wallets (ex: Flint)
    getWindow()?.ethereum?.on('accountsChanged', newAccounts => {
      const accounts = newAccounts as string[];
      if (!accounts || !accounts[0] || accounts[0] !== this.provider?.address) {
        this.provider = undefined;
      }
    });
    return this.provider;
  };
  connectNamed = async (gameInfo: GameInfo, name: string): Promise<EvmInjectedProvider> => {
    if (this.provider?.getConnection().metadata?.name === name) {
      return this.provider;
    }

    const provider = EvmInjectedConnector.getPossiblyDuplicateWalletOptions().find(
      entry => entry.metadata.name === name
    );
    if (provider == null) {
      throw new WalletNotFound(`EVM wallet ${name} not found`);
    }
    return await this.connectExternal(gameInfo, await optionToActive(provider));
  };
  getProvider = (): undefined | EvmInjectedProvider => {
    return this.provider;
  };
  getOrThrowProvider = (): EvmInjectedProvider => {
    if (this.provider == null) {
      throw new ProviderNotInitialized(`EvmInjectedConnector not initialized yet`);
    }
    return this.provider;
  };
  isConnected = (): boolean => {
    return this.provider != null;
  };
}

/**
 * For some reason I can't find any official type definitions for this
 * https://docs.metamask.io/wallet/reference/eth_sendtransaction/
 */
type Web3TransactionRequest = {
  to?: string;
  from: string;

  gas?: string;
  gasPrice?: string;

  data: string;
  value?: string;

  maxPriorityFeePerGas?: string;
  maxFeePerGas?: string;
};

export class EvmInjectedProvider implements IProvider<EvmApi> {
  constructor(
    private readonly conn: ActiveConnection<EvmApi>,
    private readonly gameInfo: GameInfo,
    readonly address: EvmAddress
  ) {}
  static init = async (
    gameInfo: GameInfo,
    conn: ActiveConnection<EvmApi>
  ): Promise<EvmInjectedProvider> => {
    const accounts = (await conn.api.request({
      method: 'eth_requestAccounts',
    })) as string[];
    if (!accounts || accounts.length === 0) {
      throw new ProviderApiError('Unknown error while receiving EVM accounts');
    }

    return new EvmInjectedProvider(conn, gameInfo, accounts[0]);
  };
  getConnection = (): ActiveConnection<EvmApi> => {
    return this.conn;
  };
  getAddress = (): AddressAndType => {
    return {
      type: AddressType.EVM,
      address: this.address.toLowerCase(),
    };
  };
  signMessage = async (message: string): Promise<UserSignature> => {
    const hexMessage = utf8ToHex(message);
    const signature = await this.conn.api.request({
      method: 'personal_sign',
      params: [hexMessage, this.getAddress().address, ''],
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
  sendTransaction = async (tx: Web3TransactionRequest): Promise<string> => {
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
