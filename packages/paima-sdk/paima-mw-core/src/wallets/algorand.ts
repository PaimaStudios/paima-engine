import type { LoginInfoMap, Result, Wallet } from '../types';
import { PaimaMiddlewareErrorCode, buildEndpointErrorFxn } from '../errors';
import { AlgorandConnector } from '@paima/providers';
import { getGameName } from '../state';
import type { WalletMode } from './wallet-modes';
import { connectWallet } from './wallet-modes';

export async function algorandLoginWrapper(
  loginInfo: LoginInfoMap[WalletMode.ALGORAND]
): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('algorandLoginWrapper');

  const gameInfo = {
    gameName: getGameName(),
    gameChainId: undefined, // Not needed because of batcher
  };
  const loginResult = await connectWallet(
    'algorandLoginWrapper',
    errorFxn,
    PaimaMiddlewareErrorCode.ALGORAND_LOGIN,
    loginInfo,
    AlgorandConnector.instance(),
    gameInfo
  );
  if (loginResult.success === false) {
    return loginResult;
  }
  return {
    success: true,
    result: {
      walletAddress: loginResult.result.getAddress(),
    },
  };
}
