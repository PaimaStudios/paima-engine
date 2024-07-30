import { AddressType, type UserSignature } from '@paima/utils';
import { optionToActive } from './IProvider.js';
import type {
  ActiveConnection,
  AddressAndType,
  ConnectionOption,
  GameInfo,
  IConnector,
  IInjectedConnector,
  IProvider,
} from './IProvider.js';
import {
  ProviderApiError,
  ProviderNotInitialized,
  UnsupportedWallet,
  WalletNotFound,
} from './errors.js';
import { getWindow } from './window.js';
import type AuroMinaApi from '@aurowallet/mina-provider';

export { MinaDelegationCache } from './mina/delegation.js';

export type MinaApi = AuroMinaApi;

type MinaAddress = any;

declare global {
  interface Window {
    mina?: Record<string, { name?: string; enable?: () => Promise<MinaApi> }>;
  }
}

export class MinaConnector implements IConnector<MinaApi>, IInjectedConnector<MinaApi> {
  private provider: MinaProvider | undefined;
  private static INSTANCE: undefined | MinaConnector = undefined;

  static getWalletOptions(): ConnectionOption<MinaApi>[] {
    const minaApi = getWindow()?.mina;
    if (minaApi == null || !minaApi.isAuro) return [];

    return [
      {
        metadata: {
          name: 'auro',
          displayName: 'Auro Wallet',
        },
        api: async (): Promise<MinaApi> => {
          return minaApi as unknown as MinaApi;
        },
      },
    ];
  }

  static instance(): MinaConnector {
    if (MinaConnector.INSTANCE == null) {
      const newInstance = new MinaConnector();
      MinaConnector.INSTANCE = newInstance;
    }
    return MinaConnector.INSTANCE;
  }

  async connectSimple(gameInfo: GameInfo): Promise<IProvider<any>> {
    if (this.provider != null) {
      return this.provider;
    }

    const options = MinaConnector.getWalletOptions();

    if (options.length === 0) {
      throw new WalletNotFound(`No Mina wallet found`);
    }

    return await this.connectExternal(gameInfo, await optionToActive(options[0]));
  }

  async connectNamed(gameInfo: GameInfo, name: string): Promise<IProvider<any>> {
    if (this.provider?.getConnection().metadata?.name === name) {
      return this.provider;
    }
    const provider = MinaConnector.getWalletOptions().find(entry => entry.metadata.name === name);
    if (provider == null) {
      throw new UnsupportedWallet(`MinaProvider: unsupported connection type ${name}`);
    }
    return await this.connectExternal(gameInfo, await optionToActive(provider));
  }

  connectExternal = async (
    gameInfo: GameInfo,
    conn: ActiveConnection<MinaApi>
  ): Promise<MinaProvider> => {
    if (this.provider?.getConnection().metadata?.name === conn.metadata.name) {
      return this.provider;
    }

    this.provider = await MinaProvider.init(gameInfo, conn);

    conn.api.on('accountsChanged', accounts => {
      if (!accounts || !accounts[0] || accounts[0] !== this.provider?.address) {
        this.provider = undefined;
      }
    });

    return this.provider;
  };
  getProvider = (): undefined | MinaProvider => {
    return this.provider;
  };
  getOrThrowProvider = (): MinaProvider => {
    if (this.provider == null) {
      throw new ProviderNotInitialized(`MinaConnector provider isn't initialized yet`);
    }
    return this.provider;
  };
  isConnected = (): boolean => {
    return this.provider != null;
  };
}

export class MinaProvider implements IProvider<MinaApi> {
  constructor(
    private readonly conn: ActiveConnection<MinaApi>,
    private readonly gameInfo: GameInfo,
    readonly address: MinaAddress
  ) {}

  static init = async (
    gameInfo: GameInfo,
    conn: ActiveConnection<MinaApi>
  ): Promise<MinaProvider> => {
    const address = await MinaProvider.fetchAddress(conn);

    return new MinaProvider(conn, gameInfo, address);
  };
  getConnection = (): ActiveConnection<MinaApi> => {
    return this.conn;
  };
  getAddress = (): AddressAndType => {
    return {
      type: AddressType.MINA,
      address: this.address,
    };
  };
  signMessage = async (message: string): Promise<UserSignature> => {
    // There is no way of choosing the signing account here. At most we could
    // monitor the changed events and erroring out if it changed.
    const signed = await this.conn.api.signMessage({ message });

    if ('signature' in signed) {
      const { signature } = signed;

      const networkKind = await this.conn.api.requestNetwork();

      // only these two options are used
      // https://github.com/aurowallet/auro-wallet-browser-extension/blob/624de322dd99baaa09617bbad4a4a838f0a88edc/src/background/lib/index.js#L17
      // this is part of the hashed message
      const network = networkKind.networkID === 'mainnet' ? 'mainnet' : 'testnet';

      return `${signature.field};${signature.scalar};${network}`;
    } else {
      throw new ProviderApiError('Failed to sign message');
    }
  };

  static fetchAddress = async (conn: ActiveConnection<MinaApi>): Promise<string> => {
    try {
      const addresses = await conn.api.requestAccounts();
      if ('length' in addresses && addresses.length > 0) {
        return addresses[0];
      } else {
        throw new ProviderApiError('requestAccounts request failed');
      }
    } catch (err) {
      console.log('[pickMinaAddress] error calling requestAccounts:', err);
    }

    throw new ProviderApiError('[pickMinaAddress] no used or unused addresses');
  };
}
