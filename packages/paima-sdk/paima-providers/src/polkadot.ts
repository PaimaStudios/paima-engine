import {
  optionToActive,
  type ActiveConnection,
  type ConnectionOption,
  type GameInfo,
  type IConnector,
  type IProvider,
  type UserSignature,
} from './IProvider';
import { ProviderApiError, ProviderNotInitialized, WalletNotFound } from './errors';
import type { InjectedExtension, InjectedWindowProvider } from '@polkadot/extension-inject/types';
import { utf8ToHex } from 'web3-utils';

export type PolkadotAddress = string;
export type PolkadotApi = InjectedExtension;

declare global {
  interface Window {
    injectedWeb3?: Record<string, InjectedWindowProvider>;
  }
}

export class PolkadotConnector implements IConnector<PolkadotApi> {
  private provider: PolkadotProvider | undefined;
  private static INSTANCE: undefined | PolkadotConnector = undefined;

  static async getWalletOptions(gameName: string): Promise<ConnectionOption<PolkadotApi>[]> {
    if (window.injectedWeb3 == null) return [];
    return Object.keys(window.injectedWeb3).map(wallet => ({
      metadata: {
        name: wallet,
        // polkadot provides no way to get a human-friendly name or icon for wallets
        displayName: wallet,
      },
      api: async (): Promise<PolkadotApi> => {
        const { web3Enable, web3FromSource } = await import('@polkadot/extension-dapp');

        await web3Enable(gameName);
        const injector = await web3FromSource(wallet);
        return injector;
      },
    }));
  }

  static instance(): PolkadotConnector {
    if (PolkadotConnector.INSTANCE == null) {
      const newInstance = new PolkadotConnector();
      PolkadotConnector.INSTANCE = newInstance;
    }
    return PolkadotConnector.INSTANCE;
  }
  connectSimple = async (gameInfo: GameInfo): Promise<PolkadotProvider> => {
    if (this.provider != null) {
      return this.provider;
    }
    const { web3Accounts, web3Enable, web3FromAddress } = await import('@polkadot/extension-dapp');
    const extensions = await web3Enable(gameInfo.gameName);
    if (extensions.length === 0) {
      throw new WalletNotFound(`[polkadot] no extension detected`);
    }

    // we get all accounts instead of picking a specific extension
    // because some extensions could have no accounts in them
    const allAccounts = await web3Accounts();
    for (const account of allAccounts) {
      const injector = await web3FromAddress(account.address);
      if (injector.signer.signRaw == null) continue;
      return await this.connectExternal(gameInfo, {
        metadata: {
          name: account.meta.source,
          // polkadot provides no way to get a human-friendly name or icon for wallets
          displayName: account.meta.source,
        },
        api: injector,
      });
    }
    throw new WalletNotFound('[polkadot] No account detected that supports signing!');
  };
  connectExternal = async (
    gameInfo: GameInfo,
    conn: ActiveConnection<PolkadotApi>
  ): Promise<PolkadotProvider> => {
    if (this.provider?.getConnection().metadata?.name === conn.metadata.name) {
      return this.provider;
    }
    this.provider = await PolkadotProvider.init(gameInfo, conn);
    return this.provider;
  };
  connectNamed = async (gameInfo: GameInfo, name: string): Promise<PolkadotProvider> => {
    if (this.provider?.getConnection().metadata?.name === name) {
      return this.provider;
    }
    const provider = (await PolkadotConnector.getWalletOptions(gameInfo.gameName)).find(
      entry => entry.metadata.name === name
    );
    if (provider == null) {
      throw new WalletNotFound(`Polkadot wallet ${name} not found`);
    }
    return await this.connectExternal(gameInfo, await optionToActive(provider));
  };
  getProvider = (): undefined | PolkadotProvider => {
    return this.provider;
  };
  getOrThrowProvider = (): PolkadotProvider => {
    if (this.provider == null) {
      throw new ProviderNotInitialized(`PolkadotConnector not initialized yet`);
    }
    return this.provider;
  };
  isConnected = (): boolean => {
    return this.provider != null;
  };
}

export class PolkadotProvider implements IProvider<PolkadotApi> {
  constructor(
    private readonly conn: ActiveConnection<PolkadotApi>,
    private readonly gameInfo: GameInfo,
    readonly address: PolkadotAddress
  ) {}
  static init = async (
    gameInfo: GameInfo,
    conn: ActiveConnection<PolkadotApi>
  ): Promise<PolkadotProvider> => {
    const account = (await conn.api.accounts.get(false))[0]?.address;
    if (account == null) {
      throw new ProviderApiError('Unknown error while receiving Polkadot accounts');
    }

    return new PolkadotProvider(conn, gameInfo, account);
  };
  getConnection = (): ActiveConnection<PolkadotApi> => {
    return this.conn;
  };
  getAddress = (): string => {
    return this.address;
  };
  signMessage = async (message: string): Promise<UserSignature> => {
    if (this.conn.api.signer.signRaw == null) {
      throw new ProviderApiError(
        `[polkadot] extension ${this.conn.metadata.name} does not support signRaw`
      );
    }
    const hexMessage = utf8ToHex(message);
    const { signature } = await this.conn.api.signer.signRaw({
      address: this.getAddress(),
      data: hexMessage,
      type: 'bytes',
    });
    return signature;
  };
}
