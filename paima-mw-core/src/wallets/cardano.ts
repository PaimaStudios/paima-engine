import web3UtilsPkg from 'web3-utils';

import type { UserSignature } from '@paima/utils';
import { hexStringToUint8Array } from '@paima/utils';

import type { CardanoApi, OldResult, Result, Wallet } from '../types';
import {
  cardanoConnected,
  getCardanoActiveWallet,
  getCardanoAddress,
  getCardanoApi,
  setCardanoActiveWallet,
  setCardanoAddress,
  setCardanoApi,
  setCardanoHexAddress,
} from '../state';
import {
  buildEndpointErrorFxn,
  PaimaMiddlewareErrorCode,
  FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED,
} from '../errors';
import { WalletMode } from './wallet-modes';
import { bech32 } from 'bech32';

const { utf8ToHex } = web3UtilsPkg;

const SUPPORTED_WALLET_IDS = ['nami', 'nufi', 'flint', 'eternl'];

const NETWORK_TAG_MAINNET = '1';
const NETWORK_TAG_TESTNET = '0';

const PREFIX_MAINNET = 'addr';
const PREFIX_TESTNET = 'addr_test';

export async function cardanoLoginSpecific(walletId: string): Promise<void> {
  if (getCardanoActiveWallet() === walletId) {
    return;
  }

  if (!SUPPORTED_WALLET_IDS.includes(walletId)) {
    throw new Error(`[cardanoLoginSpecific] Cardano wallet "${walletId}" not supported`);
  }
  const api = await (window as any).cardano[walletId].enable();
  setCardanoApi(api);
  const hexAddress = await pickCardanoAddress(api);
  const prefix = pickBech32Prefix(hexAddress);
  const words = bech32.toWords(hexStringToUint8Array(hexAddress));
  const userAddress = bech32.encode(prefix, words, 200);
  setCardanoAddress(userAddress);
  setCardanoHexAddress(hexAddress);
  setCardanoActiveWallet(walletId);
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

export async function cardanoLoginAny(): Promise<void> {
  if (cardanoConnected()) {
    return;
  }
  let error: any;
  for (const walletId of SUPPORTED_WALLET_IDS) {
    try {
      await cardanoLoginSpecific(walletId);
      if (cardanoConnected()) {
        break;
      }
    } catch (err) {
      error = err;
    }
  }
  if (!cardanoConnected()) {
    console.log('[cardanoLoginAny] error while attempting login:', error);
    throw new Error('[cardanoLogin] Unable to connect to any supported Cardano wallet');
  }
}

async function pickCardanoAddress(api: CardanoApi): Promise<string> {
  try {
    const addresses = await api.getUsedAddresses();
    if (addresses.length > 0) {
      return addresses[0];
    }
  } catch (err) {
    console.log('[pickCardanoAddress] error calling getUsedAddresses:', err);
  }

  try {
    const unusedAddresses = await api.getUnusedAddresses();
    if (unusedAddresses.length > 0) {
      return unusedAddresses[0];
    }
  } catch (err) {
    console.log('[pickCardanoAddress] error calling getUnusedAddresses:', err);
  }

  throw new Error('[pickCardanoAddress] no used or unused addresses');
}

export async function signMessageCardano(
  userAddress: string,
  message: string
): Promise<UserSignature> {
  await cardanoLoginAny();
  const api = getCardanoApi();
  const hexMessage = utf8ToHex(message).slice(2);
  const { signature, key } = await api.signData(userAddress, hexMessage);
  return `${signature}+${key}`;
}

export async function checkCardanoWalletStatus(): Promise<OldResult> {
  const errorFxn = buildEndpointErrorFxn('checkCardanoWalletStatus');

  if (getCardanoAddress() === '') {
    return errorFxn(PaimaMiddlewareErrorCode.NO_ADDRESS_SELECTED);
  }

  // TODO: more proper checking?

  return { success: true, message: '' };
}

function cardanoWalletModeToName(walletMode: WalletMode): string {
  switch (walletMode) {
    case WalletMode.CARDANO_FLINT:
      return 'flint';
    case WalletMode.CARDANO_NUFI:
      return 'nufi';
    case WalletMode.CARDANO_NAMI:
      return 'nami';
    case WalletMode.CARDANO_ETERNL:
      return 'eternl';
    default:
      return '';
  }
}

export async function cardanoLoginWrapper(walletMode: WalletMode): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('cardanoLoginWrapper');
  console.log('[cardanoLoginWrapper] window.cardano:', (window as any).cardano);

  const walletName = cardanoWalletModeToName(walletMode);
  if (!walletName) {
    return errorFxn(PaimaMiddlewareErrorCode.CARDANO_WALLET_NOT_INSTALLED);
  }

  console.log(`[cardanoLoginWrapper] Attempting to log into ${walletName}`);

  if (typeof (window as any).cardano === 'undefined') {
    return errorFxn(
      PaimaMiddlewareErrorCode.CARDANO_WALLET_NOT_INSTALLED,
      undefined,
      FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED
    );
  }

  try {
    await cardanoLoginSpecific(walletName);
  } catch (err) {
    console.log(`[cardanoLoginWrapper] Error while logging into wallet ${walletName}`);
    return errorFxn(PaimaMiddlewareErrorCode.CARDANO_LOGIN, err);
    // TODO: improve error differentiation
  }

  return {
    success: true,
    result: {
      walletAddress: getCardanoAddress(),
    },
  };
}
