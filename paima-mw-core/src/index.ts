import type { VersionString } from '@paima/utils';

import { accountsEndpoints } from './endpoints/accounts';
import { queryEndpoints } from './endpoints/queries';
import { utilityEndpoints } from './endpoints/utility';

import {
  cardanoWalletLoginEndpoint,
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

import { getBlockNumber, postDataToEndpoint } from './helpers/general';
import { getRemoteBackendVersion, awaitBlock } from './helpers/auxiliary-queries';
import { postConciselyEncodedData } from './helpers/posting';
import { buildQuery, buildBackendQuery } from './helpers/query-constructors';
import { pushLog } from './helpers/logging';

import { initAccountGuard } from './wallets/metamask';
import { sendWalletTransaction as sendMetamaskWalletTransaction } from './wallets/metamask';
import { signMessageCardano } from './wallets/cardano';
import { polkadotLoginRaw, signMessagePolkadot } from './wallets/polkadot';

import {
  setGameName,
  setGameVersion,
  getBackendUri,
  getBatcherUri,
  getActiveAddress,
  getStorageAddress,
  getDeployment,
} from './state';
import {
  buildAbstractEndpointErrorFxn,
  PaimaMiddlewareErrorCode,
  PAIMA_MIDDLEWARE_ERROR_MESSAGES,
} from './errors';

export async function initMiddlewareCore(
  gameName: string,
  gameVersion: VersionString
): Promise<void> {
  setGameName(gameName);
  setGameVersion(gameVersion);
  await initAccountGuard();
}

const paimaEndpoints = {
  ...accountsEndpoints,
  ...queryEndpoints,
  ...utilityEndpoints,
};

// Only for use in game-specific middleware:
export * from './types';
export {
  paimaEndpoints,
  getBlockNumber,
  getBackendUri,
  getBatcherUri,
  getDeployment,
  getActiveAddress,
  getStorageAddress,
  postConciselyEncodedData,
  awaitBlock,
  buildQuery,
  buildBackendQuery,
  pushLog,
  postDataToEndpoint,
  buildAbstractEndpointErrorFxn,
  PaimaMiddlewareErrorCode,
  PAIMA_MIDDLEWARE_ERROR_MESSAGES,
};

// NOT FOR USE IN PRODUCTION, just internal endpoints and helper functions for easier testing and debugging:
export {
  cardanoWalletLoginEndpoint,
  retrievePostingInfo,
  switchToBatchedCardanoMode,
  switchToBatchedEthMode,
  switchToBatchedPolkadotMode,
  switchToUnbatchedMode,
  switchToAutomaticMode,
  userWalletLoginWithoutChecks,
  automaticWalletLogin,
  updateBackendUri,
  sendMetamaskWalletTransaction,
  signMessageCardano,
  getRemoteBackendVersion,
  polkadotLoginRaw,
  signMessagePolkadot,
};
