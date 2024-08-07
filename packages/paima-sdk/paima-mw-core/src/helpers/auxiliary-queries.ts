import { wait } from '@paima/utils';
import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors.js';
import { getGameVersion } from '../state.js';
import type { Result } from '../types.js';
import { pushLog } from './logging.js';
import { getPaimaNodeRestClient } from './clients.js';

export async function getRawLatestProcessedBlockHeight(): Promise<Result<number>> {
  const errorFxn = buildEndpointErrorFxn('getRawLatestProcessedBlockHeight');

  try {
    const { data, error } = await getPaimaNodeRestClient().GET('/latest_processed_blockheight');
    if (error != null) {
      return errorFxn(PaimaMiddlewareErrorCode.INVALID_RESPONSE_FROM_BACKEND, error);
    }
    return {
      success: true,
      result: data.block_height,
    };
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.ERROR_QUERYING_BACKEND_ENDPOINT, err);
  }
}

export async function getRemoteBackendVersion(): Promise<Result<`${number}.${number}.${number}`>> {
  const errorFxn = buildEndpointErrorFxn('getRemoteBackendVersion');

  try {
    const { data: versionString, error } = await getPaimaNodeRestClient().GET('/backend_version');
    if (error != null) {
      return errorFxn(PaimaMiddlewareErrorCode.INVALID_RESPONSE_FROM_BACKEND, error);
    }
    if (versionString[0] !== '"' || versionString[versionString.length - 1] !== '"') {
      return errorFxn(
        PaimaMiddlewareErrorCode.INVALID_RESPONSE_FROM_BACKEND,
        new Error('Invalid version string: ' + versionString)
      );
    }
    return {
      success: true,
      result: versionString.slice(1, versionString.length - 1) as `${number}.${number}.${number}`,
    };
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.ERROR_QUERYING_BACKEND_ENDPOINT, err);
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
  if (remoteVersion.success === false) {
    throw new Error(remoteVersion.errorMessage);
  }

  const localComponents = localVersion.split('.').map(parseInt);
  const remoteComponents = remoteVersion.result.split('.').map(parseInt);

  pushLog('Middleware version:', localVersion);
  pushLog('Backend version:   ', remoteVersion);

  if (localComponents[0] !== remoteComponents[0]) {
    return false;
  } else {
    return true;
  }
}

export async function emulatedBlocksActiveOnBackend(): Promise<Result<boolean>> {
  const errorFxn = buildEndpointErrorFxn('emulatedBlocksActiveOnBackend');

  try {
    const { data, error } = await getPaimaNodeRestClient().GET('/emulated_blocks_active');
    if (error != null) {
      return errorFxn(PaimaMiddlewareErrorCode.INVALID_RESPONSE_FROM_BACKEND, error);
    }
    return {
      success: true,
      result: data.emulatedBlocksActive,
    };
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.ERROR_QUERYING_BACKEND_ENDPOINT, err);
  }
}

export async function deploymentChainBlockHeightToEmulated(
  deploymentBlockheight: number
): Promise<Result<number>> {
  const errorFxn = buildEndpointErrorFxn('deploymentChainBlockHeightToEmulated');

  try {
    const { data, error } = await getPaimaNodeRestClient().GET(
      '/deployment_blockheight_to_emulated',
      { params: { query: { deploymentBlockheight } } }
    );
    if (error != null) {
      return errorFxn(PaimaMiddlewareErrorCode.INVALID_RESPONSE_FROM_BACKEND, error);
    }
    return data;
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.ERROR_QUERYING_BACKEND_ENDPOINT, err);
  }
}
