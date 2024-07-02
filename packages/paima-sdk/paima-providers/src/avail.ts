import type {
  ActiveConnection,
  AddressAndType,
  GameInfo,
  IProvider,
  UserSignature,
} from './IProvider.js';
import { ProviderNotInitialized } from './errors.js';
import { utf8ToHex } from 'web3-utils';
import { AddressType, PolkadotAddress } from '@paima/utils';
import { ApiPromise, Keyring } from 'avail-js-sdk';
import { u8aToHex } from '@polkadot/util';

export type AvailJsApi = { rpc: ApiPromise; keyring: Keyring };

export class AvailConnector {
  private provider: AvailJsProvider | undefined;
  private static INSTANCE: undefined | AvailConnector = undefined;

  static instance(): AvailConnector {
    if (AvailConnector.INSTANCE == null) {
      const newInstance = new AvailConnector();
      AvailConnector.INSTANCE = newInstance;
    }
    return AvailConnector.INSTANCE;
  }

  connectExternal = async (gameInfo: GameInfo, conn: AvailJsApi): Promise<AvailJsProvider> => {
    this.provider = await AvailJsProvider.init(gameInfo, conn);
    return this.provider;
  };

  getProvider = (): undefined | AvailJsProvider => {
    return this.provider;
  };
  getOrThrowProvider = (): AvailJsProvider => {
    if (this.provider == null) {
      throw new ProviderNotInitialized(`EthersConnector not initialized yet`);
    }
    return this.provider;
  };
  isConnected = (): boolean => {
    return this.provider != null;
  };
}
export class AvailJsProvider implements IProvider<AvailJsApi> {
  constructor(
    private readonly conn: ActiveConnection<AvailJsApi>,
    private readonly gameInfo: GameInfo,
    readonly address: PolkadotAddress
  ) {}

  static init = async (gameInfo: GameInfo, api: AvailJsApi): Promise<AvailJsProvider> => {
    const pair = api.keyring.getPairs()[0];

    const conn = {
      api: api,
      metadata: {
        name: 'AvailJs',
        displayName: 'AvailJs',
      },
    };
    return new AvailJsProvider(conn, gameInfo, pair.address);
  };

  getConnection = (): ActiveConnection<AvailJsApi> => {
    return this.conn;
  };
  getAddress = (): AddressAndType => {
    return {
      type: AddressType.POLKADOT,
      address: this.address,
    };
  };
  signMessage = async (message: string): Promise<UserSignature> => {
    const hexMessage = utf8ToHex(message);
    const buffer = Buffer.from(hexMessage.slice(2), 'hex');
    const signature = this.conn.api.keyring.getPairs()[0].sign(buffer);
    return u8aToHex(signature);
  };
}
