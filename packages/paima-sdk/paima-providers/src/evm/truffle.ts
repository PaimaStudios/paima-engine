import type HDWalletProvider from '@truffle/hdwallet-provider';
import type { TransactionConfig } from 'web3-core';
import Web3 from 'web3';
import type { ActiveConnection, AddressAndType, IProvider, UserSignature } from '../IProvider.js';
import { DEFAULT_GAS_LIMIT, type EvmAddress } from './types.js';
import { ProviderNotInitialized } from '../errors.js';
import { utf8ToHex } from 'web3-utils';
import { AddressType } from '@paima/utils';

export type TruffleApi = HDWalletProvider;

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

  connectExternal = async (conn: TruffleApi): Promise<TruffleEvmProvider> => {
    this.provider = TruffleEvmProvider.init(conn);
    return this.provider;
  };
  getProvider = (): undefined | TruffleEvmProvider => {
    return this.provider;
  };
  getOrThrowProvider = (): TruffleEvmProvider => {
    if (this.provider == null) {
      throw new ProviderNotInitialized(`TruffleConnector not initialized yet`);
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

  static init = (api: TruffleApi): TruffleEvmProvider => {
    // The line below should work without the <any> addition, and does in other projects (with the same versions of imported packages),
    // but for some reason causes typing issues here.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const web3 = new Web3(<any>api);
    const address = api.getAddress();
    const conn = {
      api: api,
      metadata: {
        name: 'truffle',
        displayName: 'truffle',
      },
    };
    return new TruffleEvmProvider(conn, web3, address);
  };

  getConnection = (): ActiveConnection<TruffleApi> => {
    return this.conn;
  };
  getAddress = (): AddressAndType => {
    return {
      type: AddressType.EVM,
      address: this.address,
    };
  };
  signMessage = async (message: string): Promise<UserSignature> => {
    const hexMessage = utf8ToHex(message);
    const signature = await this.web3.eth.personal.sign(hexMessage, this.getAddress().address, '');
    return signature;
  };
  sendTransaction = async (tx: TransactionConfig): Promise<string> => {
    const nonce = await this.web3.eth.getTransactionCount(this.address);
    const finalTx = {
      ...tx,
      nonce,
      gasLimit: DEFAULT_GAS_LIMIT,
    };
    const result = await this.web3.eth.sendTransaction(finalTx);
    return result.transactionHash;
  };
}
