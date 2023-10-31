import { AddressType, hexStringToUint8Array, type UserSignature } from '@paima/utils';
import { utf8ToHex } from 'web3-utils';
import { optionToActive } from './IProvider.js';
import type {
  ActiveConnection,
  AddressAndType,
  ConnectionOption,
  GameInfo,
  IConnector,
  IProvider,
} from './IProvider.js';
import { bech32 } from 'bech32';
import { ProviderApiError, ProviderNotInitialized, WalletNotFound } from './errors.js';

// TODO: proper type definitions for CIP30
export type CardanoApi = any;
/** bech32 */
export type CardanoAddress = {
  bech32: string;
  hex: string;
};

// 4 helpers to convert hex addresses to bech32
const NETWORK_TAG_MAINNET = '1';
const NETWORK_TAG_TESTNET = '0';
const PREFIX_MAINNET = 'addr';
const PREFIX_TESTNET = 'addr_test';

export class CardanoConnector implements IConnector<CardanoApi> {
  private provider: CardanoProvider | undefined;
  private static INSTANCE: undefined | CardanoConnector = undefined;

  static getWalletOptions(): ConnectionOption<CardanoApi>[] {
    const cardanoApi: Record<string, { name?: string; enable?: () => Promise<CardanoApi> }> = (
      window as any
    ).cardano;
    if (cardanoApi == null) return [];

    const options = Object.entries(cardanoApi).reduce((options, [key, info]) => {
      if (info.name != null && info.enable != null) {
        options.push({
          metadata: {
            name: key,
            displayName: info.name,
            icon: 'icon' in info ? (info.icon as string) : undefined,
          },
          api: info.enable,
        });
      }
      return options;
    }, [] as ConnectionOption<CardanoApi>[]);
    return options;
  }

  static instance(): CardanoConnector {
    if (CardanoConnector.INSTANCE == null) {
      const newInstance = new CardanoConnector();
      CardanoConnector.INSTANCE = newInstance;
    }
    return CardanoConnector.INSTANCE;
  }
  connectSimple = async (gameInfo: GameInfo): Promise<CardanoProvider> => {
    if (this.provider != null) {
      return this.provider;
    }
    const options = CardanoConnector.getWalletOptions();
    if (options.length === 0) {
      throw new WalletNotFound(`No Cardano wallet found`);
    }

    // flint has some custom support for Paima, so best to return this one first if it exists
    const flintWallet = options.find(option => option.metadata.name === 'flint');
    if (flintWallet != null) {
      return await this.connectExternal(gameInfo, await optionToActive(flintWallet));
    }
    return await this.connectExternal(gameInfo, await optionToActive(options[0]));
  };
  connectNamed = async (gameInfo: GameInfo, name: string): Promise<CardanoProvider> => {
    if (this.provider?.getConnection().metadata?.name === name) {
      return this.provider;
    }
    const provider = CardanoConnector.getWalletOptions().find(
      entry => entry.metadata.name === name
    );
    if (provider == null) {
      throw new WalletNotFound(`Cardano wallet ${name} not found`);
    }
    return await this.connectExternal(gameInfo, await optionToActive(provider));
  };
  connectExternal = async (
    gameInfo: GameInfo,
    conn: ActiveConnection<CardanoApi>
  ): Promise<CardanoProvider> => {
    if (this.provider?.getConnection().metadata?.name === conn.metadata.name) {
      return this.provider;
    }
    this.provider = await CardanoProvider.init(gameInfo, conn);
    return this.provider;
  };
  getProvider = (): undefined | CardanoProvider => {
    return this.provider;
  };
  getOrThrowProvider = (): CardanoProvider => {
    if (this.provider == null) {
      throw new ProviderNotInitialized(`CardanoConnector provider isn't initialized yet`);
    }
    return this.provider;
  };
  isConnected = (): boolean => {
    return this.provider != null;
  };
}

function pickBech32Prefix(hexAddress: string): string {
  if (hexAddress.length < 2) {
    throw new ProviderApiError(
      `[cardanoLoginSpecific] Invalid address returned from wallet: ${hexAddress}`
    );
  }
  const networkTag = hexAddress.at(1);
  switch (networkTag) {
    case NETWORK_TAG_MAINNET:
      return PREFIX_MAINNET;
    case NETWORK_TAG_TESTNET:
      return PREFIX_TESTNET;
    default:
      throw new ProviderApiError(
        `[cardanoLoginSpecific] Invalid network tag in address ${hexAddress}`
      );
  }
}

export class CardanoProvider implements IProvider<CardanoApi> {
  constructor(
    private readonly conn: ActiveConnection<CardanoApi>,
    private readonly gameInfo: GameInfo,
    readonly address: CardanoAddress
  ) {}

  static init = async (
    gameInfo: GameInfo,
    conn: ActiveConnection<CardanoApi>
  ): Promise<CardanoProvider> => {
    const hexAddress = await CardanoProvider.fetchAddress(conn);
    const prefix = pickBech32Prefix(hexAddress);
    const words = bech32.toWords(hexStringToUint8Array(hexAddress));
    const userAddress = bech32.encode(prefix, words, 200);

    return new CardanoProvider(conn, gameInfo, {
      bech32: userAddress,
      hex: hexAddress,
    });
  };
  getConnection = (): ActiveConnection<CardanoApi> => {
    return this.conn;
  };
  getAddress = (): AddressAndType => {
    return {
      type: AddressType.CARDANO,
      address: this.address.bech32,
    };
  };
  signMessage = async (message: string): Promise<UserSignature> => {
    const hexMessage = utf8ToHex(message).slice(2);
    const address = this.conn.metadata.name === 'nami' ? this.address.hex : this.address.bech32;
    const { signature, key } = await this.conn.api.signData(address, hexMessage);
    return `${signature}+${key}`;
  };

  static fetchAddress = async (conn: ActiveConnection<CardanoApi>): Promise<string> => {
    try {
      const addresses = await conn.api.getUsedAddresses();
      if (addresses.length > 0) {
        return addresses[0];
      }
    } catch (err) {
      console.log('[pickCardanoAddress] error calling getUsedAddresses:', err);
    }

    try {
      const unusedAddresses = await conn.api.getUnusedAddresses();
      if (unusedAddresses.length > 0) {
        return unusedAddresses[0];
      }
    } catch (err) {
      console.log('[pickCardanoAddress] error calling getUnusedAddresses:', err);
    }

    throw new ProviderApiError('[pickCardanoAddress] no used or unused addresses');
  };
}
