import { PeraWalletConnect } from '@perawallet/connect';
import type { ActiveConnection, GameInfo, IConnector, IProvider, UserSignature } from './IProvider';
import { CryptoManager } from '@paima/crypto';
import { uint8ArrayToHexString } from '@paima/utils';
import { ProviderApiError, ProviderNotInitialized, UnsupportedWallet } from './errors';

export type AlgorandApi = PeraWalletConnect;
export type AlgorandAddress = string;

// TODO: this should probably be dynamically detected
enum SupportedAlgorandWallets {
  PERA = 'pera',
}

export class AlgorandConnector implements IConnector<AlgorandApi> {
  private provider: AlgorandProvider | undefined;
  private static INSTANCE: undefined | AlgorandConnector = undefined;

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
    return await this.connectNamed(gameInfo, SupportedAlgorandWallets.PERA);
  };
  connectExternal = async (
    gameInfo: GameInfo,
    conn: ActiveConnection<AlgorandApi>
  ): Promise<AlgorandProvider> => {
    this.provider = await AlgorandProvider.init(gameInfo, conn);
    return this.provider;
  };
  connectNamed = async (gameInfo: GameInfo, name: string): Promise<AlgorandProvider> => {
    if (this.provider?.getConnection().metadata?.name === name) {
      return this.provider;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (name !== SupportedAlgorandWallets.PERA) {
      throw new UnsupportedWallet(`AlgorandProvider: unknown connection type ${name}`);
    }
    const peraWallet = new PeraWalletConnect();
    return await this.connectExternal(gameInfo, {
      metadata: {
        name: SupportedAlgorandWallets.PERA,
      },
      api: peraWallet,
    });
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
  getAddress = (): string => {
    return this.address;
  };
  signMessage = async (message: string): Promise<UserSignature> => {
    const txn = CryptoManager.Algorand().buildAlgorandTransaction(this.getAddress(), message);
    const signerTx = {
      txn,
      signers: [this.getAddress()],
    };

    const signedTxs = await this.conn.api.signTransaction([[signerTx]], this.getAddress());
    if (signedTxs.length !== 1) {
      throw new ProviderApiError(
        `[signMessageAlgorand] invalid number of signatures returned: ${signedTxs.length}`
      );
    }
    const signedTx = CryptoManager.Algorand().decodeSignedTransaction(signedTxs[0]);
    const signature = signedTx.sig;
    if (!signature) {
      throw new ProviderApiError(`[signMessageAlgorand] signature missing in signed Tx`);
    }
    const hexSignature = uint8ArrayToHexString(signature);
    return hexSignature;
  };
}
