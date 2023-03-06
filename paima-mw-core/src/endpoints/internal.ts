import type { URI } from '@paima/utils';
import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors';
import { cardanoLoginAny } from '../wallets/cardano';
import { rawWalletLogin } from '../wallets/metamask';
import { connectWallet as connectTruffleWallet } from '../wallets/truffle';
import {
  getActiveAddress,
  getCardanoAddress,
  getEthAddress,
  getGameVersion,
  getPostingInfo,
  getTruffleAddress,
  setAutomaticMode,
  setBackendUri,
  setBatchedCardanoMode,
  setBatchedEthMode,
  setBatchedPolkadotMode,
  setUnbatchedMode,
} from '../state';
import type { PostingInfo, PostingModeSwitchResult, Result, Wallet } from '../types';
import { specificWalletLogin, stringToWalletMode } from '../wallets/wallets';

export async function userWalletLoginWithoutChecks(loginType: string): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('userWalletLoginWithoutChecks');

  const walletMode = stringToWalletMode(loginType);
  return await specificWalletLogin(walletMode);
}

export async function cardanoWalletLoginEndpoint(): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('cardanoWalletLoginEndpoint');
  try {
    await cardanoLoginAny();
    return {
      success: true,
      result: {
        walletAddress: getCardanoAddress(),
      },
    };
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.CARDANO_LOGIN, err);
  }
}

export async function automaticWalletLogin(privateKey: string): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('automaticWalletLogin');
  try {
    await connectTruffleWallet(privateKey);
    return {
      success: true,
      result: {
        walletAddress: getTruffleAddress(),
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
