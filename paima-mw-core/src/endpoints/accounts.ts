import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors';
import { localRemoteVersionsCompatible } from '../helpers/auxiliary-queries';
import { checkCardanoWalletStatus } from '../wallets/cardano';
import { checkEthWalletStatus } from '../wallets/metamask';
import { specificWalletLogin, stringToWalletMode } from '../wallets/wallets';
import { getPostingMode, PostingMode } from '../state';
import type { Result, OldResult, Wallet } from '../types';

// Wrapper function for all wallet status checking functions
async function checkWalletStatus(): Promise<OldResult> {
  switch (getPostingMode()) {
    case PostingMode.UNBATCHED:
    case PostingMode.BATCHED_ETH:
      return await checkEthWalletStatus();
    case PostingMode.BATCHED_CARDANO:
      return await checkCardanoWalletStatus();
    default:
      return {
        success: true,
        message: '',
      };
  }
}

// Core "login" function which tells the frontend whether the user has a wallet in a valid state
// thus allowing the game to get past the login screen
async function userWalletLogin(loginType: string): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('userWalletLogin');

  const walletMode = stringToWalletMode(loginType);
  const response = await specificWalletLogin(walletMode);
  if (!response.success) {
    return response;
  }

  try {
    if (!(await localRemoteVersionsCompatible())) {
      return errorFxn(PaimaMiddlewareErrorCode.BACKEND_VERSION_INCOMPATIBLE);
    }
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.ERROR_QUERYING_BACKEND_ENDPOINT, err);
  }

  return {
    ...response,
    result: {
      ...response.result,
      walletAddress: response.result.walletAddress,
    },
  };
}

export const accountsEndpoints = {
  userWalletLogin,
  checkWalletStatus,
};
