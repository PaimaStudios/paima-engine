import type { ActiveConnection, GameInfo, IConnector, IProvider, UserSignature } from './IProvider';
import {
  ProviderApiError,
  ProviderNotInitialized,
  UnsupportedWallet,
  WalletNotFound,
} from './errors';
import type { InjectedExtension } from '@polkadot/extension-inject/types';
import { utf8ToHex } from 'web3-utils';

export type PolkadotAddress = string;
export type PolkadotApi = InjectedExtension;

export class PolkadotConnector implements IConnector<PolkadotApi> {
  private provider: PolkadotProvider | undefined;
  private static INSTANCE: undefined | PolkadotConnector = undefined;

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
    const allAccounts = await web3Accounts();
    for (const account of allAccounts) {
      const injector = await web3FromAddress(account.address);
      if (injector.signer.signRaw == null) continue;
      return await this.connectExternal(gameInfo, {
        metadata: {
          name: account.meta.source,
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

    const { web3Enable, web3FromSource } = await import('@polkadot/extension-dapp');

    await web3Enable(gameInfo.gameName);
    try {
      const injector = await web3FromSource(name);
      return await this.connectExternal(gameInfo, {
        metadata: {
          name,
        },
        api: injector,
      });
    } catch (e) {
      throw new UnsupportedWallet(`[polkadot] no account found for extension ${name}`);
    }
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
