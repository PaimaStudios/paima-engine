import {
  buildEndpointErrorFxn,
  PaimaMiddlewareErrorCode,
  FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED,
} from '../errors';
import { getGameName } from '../state';
import type { Result, Wallet } from '../types';
import { UnsupportedWallet, WalletNotFound } from '@paima/providers';
import { PolkadotConnector } from '@paima/providers';

export async function polkadotLoginWrapper(): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('polkadotLoginWrapper');

  try {
    const provider = await PolkadotConnector.instance().connectSimple({
      gameName: getGameName(),
      gameChainId: undefined,
    });
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
