import type { VersionString } from '@paima/utils';

import { accountsEndpoints } from './endpoints/accounts.js';
import { queryEndpoints } from './endpoints/queries.js';
import { utilityEndpoints } from './endpoints/utility.js';

import { userWalletLoginWithoutChecks, updateBackendUri } from './endpoints/internal.js';

import { getBlockNumber, postDataToEndpoint } from './helpers/general.js';
import { getRemoteBackendVersion, awaitBlock } from './helpers/auxiliary-queries.js';
import {
  postConciselyEncodedData,
  postConciseData,
  postConciseDataAsync,
} from './helpers/posting.js';
export * from './helpers/clients.js';
export type * from './helpers/clients.js';
import { buildQuery } from './helpers/query-constructors.js';
import { pushLog } from './helpers/logging.js';

import { walletToName } from './name-generation/index.js';

import {
  setGameName,
  setGameVersion,
  getBackendUri,
  getBatcherUri,
  getDefaultActiveAddress,
  getActiveAddress,
  getStorageAddress,
} from './state.js';
import {
  EndpointErrorFxn,
  buildAbstractEndpointErrorFxn,
  PaimaMiddlewareErrorCode,
  PAIMA_MIDDLEWARE_ERROR_MESSAGES,
} from './errors.js';

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

export * from './delegate-wallet/index.js';
export type * from './errors.js';
// Only for use in game-specific middleware:
export * from './types.js';
export type * from './types.js';
export {
  paimaEndpoints,
  getBlockNumber,
  getBackendUri,
  getBatcherUri,
  getDefaultActiveAddress,
  getActiveAddress,
  getStorageAddress,
  postConciseData,
  postConciseDataAsync,
  postConciselyEncodedData,
  awaitBlock,
  buildQuery,
  pushLog,
  postDataToEndpoint,
  EndpointErrorFxn,
  buildAbstractEndpointErrorFxn,
  PaimaMiddlewareErrorCode,
  PAIMA_MIDDLEWARE_ERROR_MESSAGES,
  walletToName,
};

// NOT FOR USE IN PRODUCTION, just internal endpoints and helper functions for easier testing and debugging:
export { userWalletLoginWithoutChecks, updateBackendUri, getRemoteBackendVersion };
