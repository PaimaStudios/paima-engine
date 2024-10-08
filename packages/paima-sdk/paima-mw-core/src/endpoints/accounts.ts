import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors.js';
import {
  emulatedBlocksActiveOnBackend,
  localRemoteVersionsCompatible,
} from '../helpers/auxiliary-queries.js';
import { checkCardanoWalletStatus } from '../wallets/cardano.js';
import { checkEthWalletStatus } from '../wallets/evm/injected.js';
import { specificWalletLogin } from '../wallets/wallets.js';
import {
  getEmulatedBlocksActive,
  setEmulatedBlocksActive,
  setEmulatedBlocksInactive,
} from '../state.js';
import type { Wallet } from '../types.js';
import type { LoginInfo } from '../wallets/wallet-modes.js';
import type { Result, OldResult } from '@paima/utils';

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
      const activeOnBackend = await emulatedBlocksActiveOnBackend();

      if (activeOnBackend.success && activeOnBackend.result) {
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
