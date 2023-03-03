import { accountsEndpoints } from './endpoints/accounts';
import { queryEndpoints } from './endpoints/queries';
import { utilityEndpoints } from './endpoints/utility';

import {
  cardanoWalletLoginEndpoint,
  getMiddlewareConfig,
  retrievePostingInfo,
  switchToBatchedCardanoMode,
  switchToBatchedEthMode,
  switchToBatchedPolkadotMode,
  switchToUnbatchedMode,
  switchToAutomaticMode,
  userWalletLoginWithoutChecks,
  automaticWalletLogin,
  updateBackendUri,
} from './endpoints/internal';

import { sendWalletTransaction as sendMetamaskWalletTransaction } from './wallets/metamask';
import { initCardanoLib, signMessageCardano } from './wallets/cardano';
import { getRemoteBackendVersion } from './helpers/auxiliary-queries';
import { postConciselyEncodedData } from './helpers/posting';

import { initAccountGuard } from './wallets/metamask';

import { polkadotLoginRaw, signMessagePolkadot } from './wallets/polkadot';
import { setGameName, setGameVersion } from './state';
import type { VersionString } from '@paima/utils';

export async function initMiddlewareCore(
  gameName: string,
  gameVersion: VersionString
): Promise<void> {
  setGameName(gameName);
  setGameVersion(gameVersion);
  await initCardanoLib();
  await initAccountGuard();
}

const endpoints = {
  ...accountsEndpoints,
  ...queryEndpoints,
  ...utilityEndpoints,
};

export * from './types';
export {
  getMiddlewareConfig,
  userWalletLoginWithoutChecks,
  cardanoWalletLoginEndpoint,
  retrievePostingInfo,
  sendMetamaskWalletTransaction,
  signMessageCardano,
  switchToUnbatchedMode,
  switchToBatchedEthMode,
  switchToBatchedCardanoMode,
  switchToBatchedPolkadotMode,
  switchToAutomaticMode,
  automaticWalletLogin,
  updateBackendUri,
  getRemoteBackendVersion,
  postConciselyEncodedData,
  polkadotLoginRaw,
  signMessagePolkadot,
};

export default endpoints;
