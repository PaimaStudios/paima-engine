import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors';
import {
  emulatedBlocksActiveOnBackend,
  localRemoteVersionsCompatible,
} from '../helpers/auxiliary-queries';
import { checkCardanoWalletStatus } from '../wallets/cardano';
import { checkEthWalletStatus } from '../wallets/evm/injected';
import { specificWalletLogin } from '../wallets/wallets';
import {
  getEmulatedBlocksActive,
  setEmulatedBlocksActive,
  setEmulatedBlocksInactive,
} from '../state';
import type { Result, OldResult, Wallet } from '../types';
import type { LoginInfo } from '../wallets/wallet-modes';

/**
 * Wrapper function for all wallet status checking functions
 */
async function checkWalletStatus(): Promise<OldResult> {
  // TODO: what about the other currency types?
  const results = await Promise.all([checkEthWalletStatus(), checkCardanoWalletStatus()]);
  for (const result of results) {
    if (result.success === false) {
      return result;
    }
  }
  return {
    success: true,
    message: '',
  };
}

/**
 * Core "login" function which tells the frontend whether the user has a wallet in a valid state
 * thus allowing the game to get past the login screen.
 * @param preferBatchedMode - If true (or truthy value) even EVM wallet inputs will be batched.
 */
async function userWalletLogin(
  loginInfo: LoginInfo,
  setDefault: boolean = true
): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('userWalletLogin');

  const response = await specificWalletLogin(loginInfo, setDefault);
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

  if (getEmulatedBlocksActive() == null) {
    try {
      if (await emulatedBlocksActiveOnBackend()) {
        setEmulatedBlocksActive();
      } else {
        setEmulatedBlocksInactive();
      }
    } catch (err) {
      return errorFxn(PaimaMiddlewareErrorCode.ERROR_QUERYING_BACKEND_ENDPOINT, err);
    }
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
