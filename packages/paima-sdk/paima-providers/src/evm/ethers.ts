import type { Signer } from '@ethersproject/abstract-signer';
import type { TransactionRequest } from '@ethersproject/abstract-provider';
import type {
  ActiveConnection,
  AddressAndType,
  GameInfo,
  IProvider,
  UserSignature,
} from '../IProvider.js';
import { DEFAULT_GAS_LIMIT, type EvmAddress } from './types.js';
import { ProviderNotInitialized } from '../errors.js';
import { utf8ToHex } from 'web3-utils';
import { AddressType } from '@paima/utils';

export type EthersApi = Signer;

export class EthersConnector {
  private provider: EthersEvmProvider | undefined;
  private static INSTANCE: undefined | EthersConnector = undefined;

  static instance(): EthersConnector {
    if (EthersConnector.INSTANCE == null) {
      const newInstance = new EthersConnector();
      EthersConnector.INSTANCE = newInstance;
    }
    return EthersConnector.INSTANCE;
  }

  connectExternal = async (gameInfo: GameInfo, conn: EthersApi): Promise<EthersEvmProvider> => {
    this.provider = await EthersEvmProvider.init(gameInfo, conn);
    return this.provider;
  };
  getProvider = (): undefined | EthersEvmProvider => {
    return this.provider;
  };
  getOrThrowProvider = (): EthersEvmProvider => {
    if (this.provider == null) {
      throw new ProviderNotInitialized(`EthersConnector not initialized yet`);
    }
    return this.provider;
  };
  isConnected = (): boolean => {
    return this.provider != null;
  };
}
export class EthersEvmProvider implements IProvider<EthersApi> {
  constructor(
    private readonly conn: ActiveConnection<EthersApi>,
    private readonly gameInfo: GameInfo,
    readonly address: EvmAddress
  ) {}

  static init = async (gameInfo: GameInfo, api: EthersApi): Promise<EthersEvmProvider> => {
    const address = await api.getAddress();
    const conn = {
      api: api,
      metadata: {
        name: 'Ethers',
        displayName: 'Ethers',
      },
    };
    return new EthersEvmProvider(conn, gameInfo, address);
  };

  getConnection = (): ActiveConnection<EthersApi> => {
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
    const buffer = Buffer.from(hexMessage.slice(2), 'hex');
    const signature = await this.conn.api.signMessage(buffer);
    return signature;
  };
  sendTransaction = async (tx: TransactionRequest): Promise<string> => {
    const nonce = await this.conn.api.getTransactionCount(this.address);
    const finalTx = {
      ...tx,
      nonce,
      gasLimit: DEFAULT_GAS_LIMIT,
    };
    const result = await this.conn.api.sendTransaction(finalTx);
    return result.hash;
  };
}
