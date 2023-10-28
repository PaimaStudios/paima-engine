import type { URI } from '@paima/utils';
import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors';
import {
  getActiveAddress,
  getChainUri,
  getPostingInfo,
  setAutomaticMode,
  setBackendUri,
  setBatchedCardanoMode,
  setBatchedEthMode,
  setBatchedPolkadotMode,
  setEmulatedBlocksActive,
  setEmulatedBlocksInactive,
  setUnbatchedMode,
} from '../state';
import type { PostingInfo, PostingModeSwitchResult, Result, Wallet } from '../types';
import { specificWalletLogin } from '../wallets/wallets';
import { emulatedBlocksActiveOnBackend } from '../helpers/auxiliary-queries';
import { TruffleConnector } from '@paima/providers';
import HDWalletProvider from '@truffle/hdwallet-provider';
import type { LoginInfo } from '../wallets/wallet-modes';

export async function userWalletLoginWithoutChecks(loginInfo: LoginInfo): Promise<Result<Wallet>> {
  return await specificWalletLogin(loginInfo);
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
        walletAddress: provider.getAddress(),
      },
    };
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.TRUFFLE_LOGIN, err);
  }
}

export async function switchToUnbatchedMode(): Promise<PostingModeSwitchResult> {
  setUnbatchedMode();
  return {
    success: true,
    ...getPostingInfo(),
  };
}

export async function switchToBatchedEthMode(): Promise<PostingModeSwitchResult> {
  setBatchedEthMode();
  return {
    success: true,
    ...getPostingInfo(),
  };
}

export async function switchToBatchedCardanoMode(): Promise<PostingModeSwitchResult> {
  setBatchedCardanoMode();
  return {
    success: true,
    ...getPostingInfo(),
  };
}

export async function switchToBatchedPolkadotMode(): Promise<PostingModeSwitchResult> {
  setBatchedPolkadotMode();
  return {
    success: true,
    ...getPostingInfo(),
  };
}

export async function switchToAutomaticMode(): Promise<PostingModeSwitchResult> {
  setAutomaticMode();
  return {
    success: true,
    ...getPostingInfo(),
  };
}

export async function retrieveActiveAddress(): Promise<Result<string>> {
  return {
    success: true,
    result: getActiveAddress(),
  };
}

export async function retrievePostingInfo(): Promise<Result<PostingInfo>> {
  return {
    success: true,
    result: getPostingInfo(),
  };
}

export async function updateBackendUri(newUri: URI): Promise<void> {
  setBackendUri(newUri);
}
