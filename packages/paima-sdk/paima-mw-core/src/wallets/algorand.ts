import type { Result, Wallet } from '../types';
import { PaimaMiddlewareErrorCode, buildEndpointErrorFxn } from '../errors';
import { AlgorandConnector } from '@paima/providers';
import { getGameName } from '../state';

export async function algorandLoginWrapper(): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('algorandLoginWrapper');

  try {
    const provider = await AlgorandConnector.instance().connectSimple({
      gameName: getGameName(),
      gameChainId: undefined,
    });
    return {
      success: true,
      result: {
        walletAddress: provider.getAddress(),
      },
    };
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.ALGORAND_LOGIN, err);
  }
}
