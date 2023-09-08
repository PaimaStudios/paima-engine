import type { URI } from '@paima/utils';
import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors';
import {
  getActiveAddress,
  getChainUri,
  getGameName,
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
import { specificWalletLogin, stringToWalletMode } from '../wallets/wallets';
import { emulatedBlocksActiveOnBackend } from '../helpers/auxiliary-queries';
import { CardanoConnector, TruffleConnector } from '@paima/providers';
import HDWalletProvider from '@truffle/hdwallet-provider';

export async function userWalletLoginWithoutChecks(
  loginType: string,
  preferBatchedMode = false
): Promise<Result<Wallet>> {
  const walletMode = stringToWalletMode(loginType);
  return await specificWalletLogin(walletMode, preferBatchedMode);
}

export async function cardanoWalletLoginEndpoint(): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('cardanoWalletLoginEndpoint');
  try {
    const provider = await CardanoConnector.instance().connectSimple({
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
    return errorFxn(PaimaMiddlewareErrorCode.CARDANO_LOGIN, err);
  }
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
