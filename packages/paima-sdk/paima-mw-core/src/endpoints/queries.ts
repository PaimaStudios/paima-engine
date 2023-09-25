import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors';
import { getRawLatestProcessedBlockHeight } from '../helpers/auxiliary-queries';
import type { Result } from '../types';

async function getLatestProcessedBlockHeight(): Promise<Result<number>> {
  const errorFxn = buildEndpointErrorFxn('getLatestProcessedBlockHeight');
  try {
    return await getRawLatestProcessedBlockHeight();
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.UNKNOWN, err);
  }
}

export const queryEndpoints = {
  getLatestProcessedBlockHeight,
};
