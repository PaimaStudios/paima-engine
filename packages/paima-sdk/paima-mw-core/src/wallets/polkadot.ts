import {
  buildEndpointErrorFxn,
  PaimaMiddlewareErrorCode,
  FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED,
} from '../errors';
import { getGameName } from '../state';
import type { Result, Wallet } from '../types';
import { UnsupportedWallet, WalletNotFound } from '@paima/providers';
import { PolkadotConnector } from '@paima/providers';
import { WalletMode } from './wallet-modes';

// TODO: the whole concept of converting wallet mode to names should be removed
function polkadotWalletModeToName(walletMode: WalletMode): string {
  switch (walletMode) {
    default:
      return '';
  }
}

export async function polkadotLoginWrapper(walletMode: WalletMode): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('polkadotLoginWrapper');

  const walletName = polkadotWalletModeToName(walletMode);
  try {
    const provider =
      walletMode === WalletMode.POLKADOT
        ? await PolkadotConnector.instance().connectSimple({
            gameName: getGameName(),
            gameChainId: undefined, // Not needed because of batcher
          })
        : await PolkadotConnector.instance().connectNamed(
            {
              gameName: getGameName(),
              gameChainId: undefined, // Not needed because of batcher
            },
            walletName
          );
    return {
      success: true,
      result: {
        walletAddress: provider.getAddress(),
      },
    };
  } catch (err) {
    if (err instanceof WalletNotFound || err instanceof UnsupportedWallet) {
      return errorFxn(
        PaimaMiddlewareErrorCode.POLKADOT_WALLET_NOT_INSTALLED,
        undefined,
        FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED
      );
    }
    console.log(`[polkadotLoginWrapper] Error while logging into wallet`);
    return errorFxn(PaimaMiddlewareErrorCode.POLKADOT_LOGIN, err);
  }
}
