import type { OldResult, Result, Wallet } from '../types';
import {
  buildEndpointErrorFxn,
  PaimaMiddlewareErrorCode,
  FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED,
} from '../errors';
import { WalletMode } from './wallet-modes';
import { CardanoConnector, UnsupportedWallet, WalletNotFound } from '@paima/providers';
import { getGameName } from '../state';

export async function checkCardanoWalletStatus(): Promise<OldResult> {
  const errorFxn = buildEndpointErrorFxn('checkCardanoWalletStatus');

  const currentAddress = CardanoConnector.instance().getProvider()?.getAddress();
  if (currentAddress == null || currentAddress === '') {
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
  try {
    const provider = await CardanoConnector.instance().connectNamed(
      {
        gameName: getGameName(),
        gameChainId: undefined,
      },
      walletName
    );
    return {
      success: true,
      result: {
        walletAddress: provider.getAddress().toLocaleLowerCase(),
      },
    };
  } catch (err) {
    if (err instanceof WalletNotFound || err instanceof UnsupportedWallet) {
      return errorFxn(
        PaimaMiddlewareErrorCode.CARDANO_WALLET_NOT_INSTALLED,
        undefined,
        FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED
      );
    }
    console.log(`[cardanoLoginWrapper] Error while logging into wallet ${walletName}`);
    return errorFxn(PaimaMiddlewareErrorCode.CARDANO_LOGIN, err);
    // TODO: improve error differentiation
  }
}
