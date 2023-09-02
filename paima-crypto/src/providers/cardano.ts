import type { UserSignature } from '@paima/utils';
import { utf8ToHex } from 'web3-utils';
import type { ActiveConnection, IProvider } from './IProvider';
import { bech32 } from 'bech32';

// TODO: proper type definitions for CIP30
export type CardanoApi = any;
/** bech32 */
export type CardanoAddress = string;

const SUPPORTED_WALLET_IDS = ['nami', 'nufi', 'flint', 'eternl'];

// 4 helpers to convert hex addresses to bech32
const NETWORK_TAG_MAINNET = '1';
const NETWORK_TAG_TESTNET = '0';
const PREFIX_MAINNET = 'addr';
const PREFIX_TESTNET = 'addr_test';

export class CardanoProvider implements IProvider<CardanoApi> {
  conn: ActiveConnection<CardanoApi> | undefined;
  address: CardanoAddress | undefined;

  connectSimple = async (): Promise<void> => {
    if (this.conn != null) {
      return;
    }
    let error: unknown;
    for (const walletId of SUPPORTED_WALLET_IDS) {
      try {
        await this.connectNamed(walletId);
        if (this.isConnected()) {
          break;
        }
      } catch (err) {
        error = err;
      }
    }
    if (!this.isConnected()) {
      console.log('[cardanoLoginAny] error while attempting login:', error);
      throw new Error('[cardanoLogin] Unable to connect to any supported Cardano wallet');
    }
  };
  connectNamed = async (name: string): Promise<void> => {
    if (this.conn?.metadata?.name === name) {
      return;
    }
    if (!SUPPORTED_WALLET_IDS.includes(name)) {
      throw new Error(`[cardanoLoginSpecific] Cardano wallet "${name}" not supported`);
    }
    const api = await (window as any).cardano[name].enable();
    this.conn = api;
    const hexAddress = await this.fetchAddress();
    const prefix = pickBech32Prefix(hexAddress);
    const words = bech32.toWords(hexStringToUint8Array(hexAddress));
    const userAddress = bech32.encode(prefix, words, 200);
    setCardanoAddress(userAddress);
    setCardanoHexAddress(hexAddress);
    setCardanoActiveWallet(walletId);
  };
  connectExternal = (conn: ActiveConnection<CardanoApi>): void => {
    this.conn = conn;
  };
  getConnection = (): undefined | ActiveConnection<CardanoApi> => {
    return this.conn;
  };
  isConnected = (): boolean => {
    return this.conn != null;
  };
  fetchAddress = async (): Promise<string> => {
    if (this.conn == null)
      throw new Error(`[pickCardanoAddress] wallet connection not established`);
    try {
      const addresses = await this.conn.api.getUsedAddresses();
      if (addresses.length > 0) {
        return addresses[0];
      }
    } catch (err) {
      console.log('[pickCardanoAddress] error calling getUsedAddresses:', err);
    }

    try {
      const unusedAddresses = await this.conn.api.getUnusedAddresses();
      if (unusedAddresses.length > 0) {
        return unusedAddresses[0];
      }
    } catch (err) {
      console.log('[pickCardanoAddress] error calling getUnusedAddresses:', err);
    }

    throw new Error('[pickCardanoAddress] no used or unused addresses');
  };
  getAddress = (): string => {
    return this.address;
  };
  signMessage = async (userAddress: string, message: string): Promise<UserSignature> => {
    await this.connectSimple();
    if (this.conn == null) throw Error(`[Cardano signMessage] wallet connection not established`);
    const hexMessage = utf8ToHex(message).slice(2);
    const { signature, key } = await this.conn.api.signData(userAddress, hexMessage);
    return `${signature}+${key}`;
  };
}

function pickBech32Prefix(hexAddress: string): string {
  if (hexAddress.length < 2) {
    throw new Error(`[cardanoLoginSpecific] Invalid address returned from wallet: ${hexAddress}`);
  }
  const networkTag = hexAddress.at(1);
  switch (networkTag) {
    case NETWORK_TAG_MAINNET:
      return PREFIX_MAINNET;
    case NETWORK_TAG_TESTNET:
      return PREFIX_TESTNET;
    default:
      throw new Error(`[cardanoLoginSpecific] Invalid network tag in address ${hexAddress}`);
  }
}
