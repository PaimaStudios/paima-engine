import { PeraWalletConnect } from '@perawallet/connect';
import { getAlgorandAddress, setAlgorandAddress, setAlgorandApi } from '../state';
import type { Result, Wallet } from '../types';
import { PaimaMiddlewareErrorCode, buildEndpointErrorFxn } from '../errors';

export async function algorandLoginWrapper(): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('algorandLoginWrapper');

  try {
    await peraLogin();
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.ALGORAND_LOGIN, err);
  }

  return {
    success: true,
    result: {
      walletAddress: getAlgorandAddress(),
    },
  };
}
