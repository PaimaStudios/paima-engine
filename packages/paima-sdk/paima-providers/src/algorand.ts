import type { PeraWalletConnect } from '@perawallet/connect';
import type {
  ActiveConnection,
  ConnectionOption,
  GameInfo,
  IConnector,
  IProvider,
  UserSignature,
  AddressAndType,
} from './IProvider.js';
import { optionToActive } from './IProvider.js';
import { CryptoManager } from '@paima/crypto';
import { AddressType, uint8ArrayToHexString } from '@paima/utils';
import {
  ProviderApiError,
  ProviderNotInitialized,
  UnsupportedWallet,
  WalletNotFound,
} from './errors.js';

export type AlgorandApi = PeraWalletConnect;
export type AlgorandAddress = string;

export class AlgorandConnector implements IConnector<AlgorandApi> {
  private provider: AlgorandProvider | undefined;
  private static INSTANCE: undefined | AlgorandConnector = undefined;

  static getWalletOptions(): ConnectionOption<AlgorandApi>[] {
    // Algorand has no standard for wallet discovery
    // The closest that exists is ARC11 (https://arc.algorand.foundation/ARCs/arc-0011)
    // but it doesn't give any information about which wallet is injected
    // and, similar to window.ethereum, has wallets overriding each other
    // and Pera wallet doesn't even use this standard
    // instead, the best we can do is check if Pera injected its UI component in the window
    if (window.customElements.get('pera-wallet-connect-modal') == null) {
      return [];
    }
    return [
      {
        metadata: {
          name: 'pera',
          displayName: 'Pera Wallet',
        },
        api: async (): Promise<AlgorandApi> => {
          const { PeraWalletConnect } = await import('@perawallet/connect');
          const peraWallet = new PeraWalletConnect();
          return peraWallet;
        },
      },
    ];
  }

  static instance(): AlgorandConnector {
    if (AlgorandConnector.INSTANCE == null) {
      const newInstance = new AlgorandConnector();
      AlgorandConnector.INSTANCE = newInstance;
    }
    return AlgorandConnector.INSTANCE;
  }
  connectSimple = async (gameInfo: GameInfo): Promise<AlgorandProvider> => {
    if (this.provider != null) {
      return this.provider;
    }
    const options = AlgorandConnector.getWalletOptions();
    if (options.length === 0) {
      throw new WalletNotFound(`No Algorand wallet found`);
    }
    return await this.connectExternal(gameInfo, await optionToActive(options[0]));
  };
  connectExternal = async (
    gameInfo: GameInfo,
    conn: ActiveConnection<AlgorandApi>
  ): Promise<AlgorandProvider> => {
    if (this.provider?.getConnection().metadata?.name === conn.metadata.name) {
      return this.provider;
    }
    this.provider = await AlgorandProvider.init(gameInfo, conn);
    return this.provider;
  };
  connectNamed = async (gameInfo: GameInfo, name: string): Promise<AlgorandProvider> => {
    if (this.provider?.getConnection().metadata?.name === name) {
      return this.provider;
    }
    const provider = AlgorandConnector.getWalletOptions().find(
      entry => entry.metadata.name === name
    );
    if (provider == null) {
      throw new UnsupportedWallet(`AlgorandProvider: unsupported connection type ${name}`);
    }
    return await this.connectExternal(gameInfo, await optionToActive(provider));
  };
  getProvider = (): undefined | AlgorandProvider => {
    return this.provider;
  };
  getOrThrowProvider = (): AlgorandProvider => {
    if (this.provider == null) {
      throw new ProviderNotInitialized(`AlgorandConnector provider isn't initialized yet`);
    }
    return this.provider;
  };
  isConnected = (): boolean => {
    return this.provider != null;
  };
}

export class AlgorandProvider implements IProvider<AlgorandApi> {
  constructor(
    private readonly conn: ActiveConnection<AlgorandApi>,
    private readonly gameInfo: GameInfo,
    readonly address: AlgorandAddress
  ) {}
  static init = async (
    gameInfo: GameInfo,
    conn: ActiveConnection<AlgorandApi>
  ): Promise<AlgorandProvider> => {
    const newAccounts = await conn.api.connect();
    if (newAccounts.length < 1) {
      throw new ProviderApiError('[peraLogin] no addresses returned!');
    }
    return new AlgorandProvider(conn, gameInfo, newAccounts[0]);
  };
  getConnection = (): ActiveConnection<AlgorandApi> => {
    return this.conn;
  };
  getAddress = (): AddressAndType => {
    return {
      type: AddressType.ALGORAND,
      address: this.address,
    };
  };
  signMessage = async (message: string): Promise<UserSignature> => {
    const txn = await CryptoManager.Algorand().buildAlgorandTransaction(
      this.getAddress().address,
      message
    );
    const signerTx = {
      txn,
      signers: [this.getAddress().address],
    };

    const signedTxs = await this.conn.api.signTransaction([[signerTx]], this.getAddress().address);
    if (signedTxs.length !== 1) {
      throw new ProviderApiError(
        `[signMessageAlgorand] invalid number of signatures returned: ${signedTxs.length}`
      );
    }
    const signedTx = await CryptoManager.Algorand().decodeSignedTransaction(signedTxs[0]);
    const signature = signedTx.sig;
    if (!signature) {
      throw new ProviderApiError(`[signMessageAlgorand] signature missing in signed Tx`);
    }
    const hexSignature = uint8ArrayToHexString(signature);
    return hexSignature;
  };
}
