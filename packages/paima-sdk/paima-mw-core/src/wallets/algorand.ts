import type { Result, Wallet } from '../types';
import { PaimaMiddlewareErrorCode, buildEndpointErrorFxn } from '../errors';
import { AlgorandConnector } from '@paima/providers';
import { getGameName } from '../state';
import { WalletMode } from './wallet-modes';

// TODO: the whole concept of converting wallet mode to names should be removed
function algorandWalletModeToName(walletMode: WalletMode): string {
  switch (walletMode) {
    case WalletMode.ALGORAND_PERA:
      return 'pera';
    default:
      return '';
  }
}

export async function algorandLoginWrapper(walletMode: WalletMode): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('algorandLoginWrapper');

  const walletName = algorandWalletModeToName(walletMode);
  try {
    const provider =
      walletMode === WalletMode.ALGORAND
        ? await AlgorandConnector.instance().connectSimple({
            gameName: getGameName(),
            gameChainId: undefined, // Not needed because of batcher
          })
        : await AlgorandConnector.instance().connectNamed(
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
    return errorFxn(PaimaMiddlewareErrorCode.ALGORAND_LOGIN, err);
  }
}
