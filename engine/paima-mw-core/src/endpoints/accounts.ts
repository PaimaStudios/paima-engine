import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors';
import {
  emulatedBlocksActiveOnBackend,
  localRemoteVersionsCompatible,
} from '../helpers/auxiliary-queries';
import { checkCardanoWalletStatus } from '../wallets/cardano';
import { checkEthWalletStatus } from '../wallets/evm';
import { specificWalletLogin, stringToWalletMode } from '../wallets/wallets';
import {
  getPostingMode,
  PostingMode,
  setEmulatedBlocksActive,
  setEmulatedBlocksInactive,
} from '../state';
import type { Result, OldResult, Wallet } from '../types';

/**
 * Wrapper function for all wallet status checking functions
 */
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

/**
 * Core "login" function which tells the frontend whether the user has a wallet in a valid state
 * thus allowing the game to get past the login screen.
 * @param preferBatchedMode - If true (or truthy value) even EVM wallet inputs will be batched.
 */
async function userWalletLogin(
  loginType: string,
  preferBatchedMode: boolean = false
): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('userWalletLogin');

  const walletMode = stringToWalletMode(loginType);
  // Unity bridge uses 0|1 instead of booleans
  const response = await specificWalletLogin(walletMode, !!preferBatchedMode);
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

  try {
    if (await emulatedBlocksActiveOnBackend()) {
      setEmulatedBlocksActive();
    } else {
      setEmulatedBlocksInactive();
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
