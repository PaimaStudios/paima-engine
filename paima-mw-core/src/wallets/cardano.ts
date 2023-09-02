import web3UtilsPkg from 'web3-utils';

import type { UserSignature } from '@paima/utils';
import { hexStringToUint8Array } from '@paima/utils';

import type { OldResult, Result, Wallet } from '../types';
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

const SUPPORTED_WALLET_IDS = ['nami', 'nufi', 'flint', 'eternl'];

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
      walletAddress: getCardanoAddress().toLocaleLowerCase(),
    },
  };
}
