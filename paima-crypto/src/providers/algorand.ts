import { PeraWalletConnect } from '@perawallet/connect';
import type { ActiveConnection, IConnector, IProvider, UserSignature } from './IProvider';
import { CryptoManager } from '../crypto';
import { uint8ArrayToHexString } from '@paima/utils';

export type AlgorandApi = PeraWalletConnect | undefined;
export type AlgorandAddress = string;

// TODO: this should probably be dynamically detected
enum SupportedAlgorandWallets {
  PERA = 'pera',
}

export class AlgorandConnector implements IConnector<PeraWalletConnect> {
  provider: AlgorandProvider | undefined;

  connectSimple = async (): Promise<void> => {
    await this.connectNamed(SupportedAlgorandWallets.PERA);
  };
  connectExternal = async (conn: ActiveConnection<PeraWalletConnect>): Promise<void> => {
    const address = await this.fetchAddress(conn.api);
    this.provider = new AlgorandProvider(conn, address);
  };
  connectNamed = async (name: string): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (name !== SupportedAlgorandWallets.PERA) {
      throw new Error(`AlgorandProvider: unknown connection type ${name}`);
    }
    const peraWallet = new PeraWalletConnect();
    await this.connectExternal({
      metadata: {
        name: SupportedAlgorandWallets.PERA,
      },
      api: peraWallet,
    });
  };
  getProvider = (): undefined | AlgorandProvider => {
    return this.provider;
  };
  isConnected = (): boolean => {
    return this.provider != null;
  };
  fetchAddress = async (conn: PeraWalletConnect): Promise<string> => {
    const newAccounts = await conn.connect();
    if (newAccounts.length < 1) {
      throw new Error('[peraLogin] no addresses returned!');
    }
    return newAccounts[0];
  };
}

export class AlgorandProvider implements IProvider<PeraWalletConnect> {
  constructor(
    readonly conn: ActiveConnection<PeraWalletConnect>,
    readonly address: AlgorandAddress
  ) {}
  getConnection = (): ActiveConnection<PeraWalletConnect> => {
    return this.conn;
  };
  getAddress = (): string => {
    if (this.address == null) {
      throw new Error(`AlgorandProvider address is not set`);
    }
    return this.address;
  };
  signMessage = async (userAddress: string, message: string): Promise<UserSignature> => {
    const peraWallet = this.conn.api;
    if (!peraWallet) {
      throw new Error('');
    }

    const txn = CryptoManager.Algorand().buildAlgorandTransaction(userAddress, message);
    const signerTx = {
      txn,
      signers: [userAddress],
    };

    const signedTxs = await this.conn.api.signTransaction([[signerTx]], userAddress);
    if (signedTxs.length !== 1) {
      throw new Error(
        `[signMessageAlgorand] invalid number of signatures returned: ${signedTxs.length}`
      );
    }
    const signedTx = CryptoManager.Algorand().decodeSignedTransaction(signedTxs[0]);
    const signature = signedTx.sig;
    if (!signature) {
      throw new Error(`[signMessageAlgorand] signature missing in signed Tx`);
    }
    const hexSignature = uint8ArrayToHexString(signature);
    return hexSignature;
  };
}
