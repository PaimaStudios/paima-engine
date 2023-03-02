import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors';
import { getRawLatestProcessedBlockHeight } from '../helpers/auxiliary-queries';
import { FailedResult, SuccessfulResult } from '../types';

async function getLatestProcessedBlockHeight(): Promise<SuccessfulResult<number> | FailedResult> {
  const errorFxn = buildEndpointErrorFxn('getLatestProcessedBlockHeight');
  try {
    return getRawLatestProcessedBlockHeight();
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.UNKNOWN, err);
  }
}

export const queryEndpoints = {
  getLatestProcessedBlockHeight,
};
