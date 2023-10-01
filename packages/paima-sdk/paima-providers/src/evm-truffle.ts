import type HDWalletProvider from '@truffle/hdwallet-provider';
import Web3 from 'web3';
import type { ActiveConnection, IProvider, UserSignature } from './IProvider';
import type { EvmAddress } from './evm';
import { ProviderNotInitialized } from './errors';
import { utf8ToHex } from 'web3-utils';

export type TruffleApi = HDWalletProvider;

export const DEFAULT_GAS_LIMIT = 100000;

export class TruffleConnector {
  private provider: TruffleEvmProvider | undefined;
  private static INSTANCE: undefined | TruffleConnector = undefined;

  static instance(): TruffleConnector {
    if (TruffleConnector.INSTANCE == null) {
      const newInstance = new TruffleConnector();
      TruffleConnector.INSTANCE = newInstance;
    }
    return TruffleConnector.INSTANCE;
  }

  connectExternal = async (conn: HDWalletProvider): Promise<TruffleEvmProvider> => {
    this.provider = TruffleEvmProvider.init(conn);
    return this.provider;
  };
  getProvider = (): undefined | TruffleEvmProvider => {
    return this.provider;
  };
  getOrThrowProvider = (): TruffleEvmProvider => {
    if (this.provider == null) {
      throw new ProviderNotInitialized(`EvmConnector not initialized yet`);
    }
    return this.provider;
  };
  isConnected = (): boolean => {
    return this.provider != null;
  };
}
export class TruffleEvmProvider implements IProvider<TruffleApi> {
  constructor(
    private readonly conn: ActiveConnection<TruffleApi>,
    public readonly web3: Web3,
    readonly address: EvmAddress
  ) {}

  static init = (hdWalletProvider: HDWalletProvider): TruffleEvmProvider => {
    // The line below should work without the <any> addition, and does in other projects (with the same versions of imported packages),
    // but for some reason causes typing issues here.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const web3 = new Web3(<any>hdWalletProvider);
    const address = hdWalletProvider.getAddress();
    const conn = {
      api: hdWalletProvider,
      metadata: {
        name: 'truffle',
      },
    };
    return new TruffleEvmProvider(conn, web3, address);
  };

  getConnection = (): ActiveConnection<TruffleApi> => {
    return this.conn;
  };
  getAddress = (): string => {
    return this.address;
  };
  signMessage = async (message: string): Promise<UserSignature> => {
    const hexMessage = utf8ToHex(message);
    const signature = await this.web3.eth.personal.sign(hexMessage, this.getAddress(), '');
    return signature;
  };
  sendTransaction = async (tx: Record<string, any>): Promise<string> => {
    const nonce = await this.web3.eth.getTransactionCount(this.address);
    const finalTx = {
      ...tx,
      nonce,
      gasLimit: DEFAULT_GAS_LIMIT,
    };
    const result = await this.web3.eth.sendTransaction(finalTx);
    return result?.transactionHash || '';
  };
}
