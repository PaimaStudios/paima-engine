import type { LoginInfoMap, OldResult, Result } from '../types.js';
import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors.js';
import { connectInjected } from './wallet-modes.js';
import { CardanoConnector, WalletMode } from '@paima/providers';
import type { ApiForMode, IProvider } from '@paima/providers';
import { getGameName, hasLogin } from '../state.js';

export async function checkCardanoWalletStatus(): Promise<OldResult> {
  const errorFxn = buildEndpointErrorFxn('checkCardanoWalletStatus');

  if (!hasLogin(WalletMode.Cardano)) {
    return { success: true, message: '' };
  }
  const provider = CardanoConnector.instance().getProvider();
  if (provider == null) {
    return errorFxn(PaimaMiddlewareErrorCode.NO_ADDRESS_SELECTED);
  }

  return { success: true, message: '' };
}

export async function cardanoLoginWrapper(
  loginInfo: LoginInfoMap[WalletMode.Cardano]
): Promise<Result<IProvider<ApiForMode<WalletMode.Cardano>>>> {
  const errorFxn = buildEndpointErrorFxn('cardanoLoginWrapper');

  const gameInfo = {
    gameName: getGameName(),
    gameChainId: undefined, // Not needed because of batcher
  };
  const loginResult = await connectInjected(
    'cardanoLoginWrapper',
    errorFxn,
    PaimaMiddlewareErrorCode.CARDANO_LOGIN,
    loginInfo,
    CardanoConnector.instance(),
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
