import type { URI } from '@paima/utils';
import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors.js';
import {
  getChainUri,
  setBackendUri,
  setEmulatedBlocksActive,
  setEmulatedBlocksInactive,
} from '../state.js';
import type { Result, Wallet } from '../types.js';
import { specificWalletLogin } from '../wallets/wallets.js';
import { emulatedBlocksActiveOnBackend } from '../helpers/auxiliary-queries.js';
import { TruffleConnector } from '@paima/providers';
import HDWalletProvider from '@truffle/hdwallet-provider';
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

export async function automaticWalletLogin(privateKey: string): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('automaticWalletLogin');
  try {
    const provider = await TruffleConnector.instance().connectExternal(
      new HDWalletProvider({
        privateKeys: [privateKey],
        providerOrUrl: getChainUri(),
      })
    );

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
      success: true,
      result: {
        walletAddress: provider.getAddress().address,
      },
    };
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.TRUFFLE_LOGIN, err);
  }
}

export async function updateBackendUri(newUri: URI): Promise<void> {
  setBackendUri(newUri);
}
