import { wait } from '@paima/utils';
import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors.js';
import { getGameVersion } from '../state.js';
import type { Result } from '../types.js';
import { pushLog } from './logging.js';
import {
  backendQueryBackendVersion,
  backendQueryDeploymentBlockheightToEmulated,
  backendQueryEmulatedBlocksActive,
  backendQueryLatestProcessedBlockHeight,
} from './query-constructors.js';

export async function getRawLatestProcessedBlockHeight(): Promise<Result<number>> {
  const errorFxn = buildEndpointErrorFxn('getRawLatestProcessedBlockHeight');

  let res: Response;
  try {
    const query = backendQueryLatestProcessedBlockHeight();
    res = await fetch(query);
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.ERROR_QUERYING_BACKEND_ENDPOINT, err);
  }

  try {
    const j = (await res.json()) as { block_height: number };
    // TODO: properly typecheck
    return {
      success: true,
      result: j.block_height,
    };
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.INVALID_RESPONSE_FROM_BACKEND, err);
  }
}

// TODO: reworking this to use serverEndpointCall requires the endpoint to return a JSON
export async function getRemoteBackendVersion(): Promise<string> {
  const errorFxn = buildEndpointErrorFxn('getRemoteBackendVersion');

  let res: Response;
  try {
    const query = backendQueryBackendVersion();
    res = await fetch(query);
  } catch (err) {
    errorFxn(PaimaMiddlewareErrorCode.ERROR_QUERYING_BACKEND_ENDPOINT, err);
    throw err;
  }

  try {
    const versionString = await res.text();
    if (versionString[0] !== '"' || versionString[versionString.length - 1] !== '"') {
      throw new Error('Invalid version string: ' + versionString);
    }
    return versionString.slice(1, versionString.length - 1);
  } catch (err) {
    errorFxn(PaimaMiddlewareErrorCode.INVALID_RESPONSE_FROM_BACKEND, err);
    throw err;
  }
}

/**
 * Waits until awaitedBlock has been processed by the backend
 */
export async function awaitBlock(awaitedBlock: number): Promise<void> {
  const BLOCK_DELAY = 1000;
  let currentBlock = -1;
  while (currentBlock < awaitedBlock) {
    const res = await getRawLatestProcessedBlockHeight();
    if (res.success) {
      currentBlock = res.result;
    }
    if (!res.success || currentBlock < awaitedBlock) {
      await wait(BLOCK_DELAY);
    }
  }
}

export async function localRemoteVersionsCompatible(): Promise<boolean> {
  const localVersion = getGameVersion();
  const remoteVersion = await getRemoteBackendVersion();

  const localComponents = localVersion.split('.').map(parseInt);
  const remoteComponents = remoteVersion.split('.').map(parseInt);

  pushLog('Middleware version:', localVersion);
  pushLog('Backend version:   ', remoteVersion);

  if (localComponents[0] !== remoteComponents[0]) {
    return false;
  } else {
    return true;
  }
}

export async function emulatedBlocksActiveOnBackend(): Promise<boolean> {
  const errorFxn = buildEndpointErrorFxn('emulatedBlocksActiveOnBackend');

  let res: Response;
  try {
    const query = backendQueryEmulatedBlocksActive();
    res = await fetch(query);
  } catch (err) {
    errorFxn(PaimaMiddlewareErrorCode.ERROR_QUERYING_BACKEND_ENDPOINT, err);
    throw err;
  }

  try {
    const emulatedBlocksResult = (await res.json()) as { emulatedBlocksActive: boolean };
    return emulatedBlocksResult.emulatedBlocksActive;
  } catch (err) {
    errorFxn(PaimaMiddlewareErrorCode.INVALID_RESPONSE_FROM_BACKEND, err);
    throw err;
  }
}

export async function deploymentChainBlockHeightToEmulated(
  deploymentBlockheight: number
): Promise<number> {
  const errorFxn = buildEndpointErrorFxn('deploymentChainBlockHeightToEmulated');

  const query = backendQueryDeploymentBlockheightToEmulated(deploymentBlockheight);
  const res = await fetch(query);

  const conversionResult = (await res.json()) as Result<number>;
  if (!conversionResult.success) {
    throw new Error(`Error converting blockheight: ${conversionResult.errorMessage}`);
  }
  return conversionResult.result;
}
