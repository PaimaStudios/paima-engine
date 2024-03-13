import type { URI } from '@paima/utils';
import { setBackendUri } from '../state.js';
import type { Result, Wallet } from '../types.js';
import { specificWalletLogin } from '../wallets/wallets.js';
import type { LoginInfo } from '../wallets/wallet-modes.js';

/**
 * @deprecated do not use this unless you are really sure. Instead, prefer `userWalletLogin`
 */
export async function userWalletLoginWithoutChecks(
  loginInfo: LoginInfo,
  setDefault: boolean = true
): Promise<Result<Wallet>> {
  return await specificWalletLogin(loginInfo, setDefault);
}

export async function updateBackendUri(newUri: URI): Promise<void> {
  setBackendUri(newUri);
}
