import type { VersionString } from '@paima/utils';

import { accountsEndpoints } from './endpoints/accounts';
import { queryEndpoints } from './endpoints/queries';
import { utilityEndpoints } from './endpoints/utility';

import {
  userWalletLoginWithoutChecks,
  automaticWalletLogin,
  updateBackendUri,
} from './endpoints/internal';

import { getBlockNumber, postDataToEndpoint } from './helpers/general';
import { getRemoteBackendVersion, awaitBlock } from './helpers/auxiliary-queries';
import { postConciselyEncodedData, postConciseData } from './helpers/posting';
import { buildQuery, buildBackendQuery } from './helpers/query-constructors';
import { pushLog } from './helpers/logging';

import { walletToName } from './name-generation';

import {
  setGameName,
  setGameVersion,
  getBackendUri,
  getBatcherUri,
  getDefaultActiveAddress,
  getActiveAddress,
  getStorageAddress,
  getDeployment,
} from './state';
import {
  EndpointErrorFxn,
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
}

const paimaEndpoints = {
  ...accountsEndpoints,
  ...queryEndpoints,
  ...utilityEndpoints,
};

export type * from './errors';
// Only for use in game-specific middleware:
export * from './types';
export type * from './types';
export {
  paimaEndpoints,
  getBlockNumber,
  getBackendUri,
  getBatcherUri,
  getDeployment,
  getDefaultActiveAddress,
  getActiveAddress,
  getStorageAddress,
  postConciseData,
  postConciselyEncodedData,
  awaitBlock,
  buildQuery,
  buildBackendQuery,
  pushLog,
  postDataToEndpoint,
  EndpointErrorFxn,
  buildAbstractEndpointErrorFxn,
  PaimaMiddlewareErrorCode,
  PAIMA_MIDDLEWARE_ERROR_MESSAGES,
  walletToName,
};

// NOT FOR USE IN PRODUCTION, just internal endpoints and helper functions for easier testing and debugging:
export {
  userWalletLoginWithoutChecks,
  automaticWalletLogin,
  updateBackendUri,
  getRemoteBackendVersion,
};
