import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors.js';
import { getRawLatestProcessedBlockHeight } from '../helpers/auxiliary-queries.js';
import type { Result } from '../types.js';

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
