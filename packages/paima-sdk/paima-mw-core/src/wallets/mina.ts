import type { LoginInfoMap, Result } from '../types.js';
import { PaimaMiddlewareErrorCode, buildEndpointErrorFxn } from '../errors.js';
import { MinaConnector } from '@paima/providers';
import type { ApiForMode, IProvider, WalletMode } from '@paima/providers';
import { getGameName } from '../state.js';
import { connectInjected } from './wallet-modes.js';

export async function minaLoginWrapper(
  loginInfo: LoginInfoMap[WalletMode.Mina]
): Promise<Result<IProvider<ApiForMode<WalletMode.Mina>>>> {
  const errorFxn = buildEndpointErrorFxn('minaLoginWrapper');

  const gameInfo = {
    gameName: getGameName(),
    gameChainId: undefined, // Not needed because of batcher
  };
  const loginResult = await connectInjected(
    'minaLoginWrapper',
    errorFxn,
    PaimaMiddlewareErrorCode.MINA_LOGIN,
    loginInfo,
    MinaConnector.instance(),
    gameInfo
  );
  if (loginResult.success === false) {
    return loginResult;
  }
  return {
    success: true,
    result: loginResult.result,
  };
}
