import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors.js';
import { getGameName } from '../state.js';
import type { LoginInfoMap, Result } from '../types.js';
import { PolkadotConnector } from '@paima/providers';
import type { ApiForMode, IProvider, WalletMode } from '@paima/providers';
import { connectInjected } from './wallet-modes.js';

export async function polkadotLoginWrapper(
  loginInfo: LoginInfoMap[WalletMode.Polkadot]
): Promise<Result<IProvider<ApiForMode<WalletMode.Polkadot>>>> {
  const errorFxn = buildEndpointErrorFxn('polkadotLoginWrapper');

  const gameInfo = {
    gameName: getGameName(),
    gameChainId: undefined, // Not needed because of batcher
  };
  const loginResult = await connectInjected(
    'polkadotLoginWrapper',
    errorFxn,
    PaimaMiddlewareErrorCode.POLKADOT_LOGIN,
    loginInfo,
    PolkadotConnector.instance(),
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
