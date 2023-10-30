import type { LoginInfoMap, OldResult, Result } from '../types';
import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors';
import { connectInjected } from './wallet-modes';
import { CardanoConnector } from '@paima/providers';
import type { ApiForMode, IProvider, WalletMode } from '@paima/providers';
import { getGameName } from '../state';

export async function checkCardanoWalletStatus(): Promise<OldResult> {
  const errorFxn = buildEndpointErrorFxn('checkCardanoWalletStatus');

  const provider = CardanoConnector.instance().getProvider();
  if (provider == null) {
    // TODO: this is not quite right. We want to know if we had a provider, but not anymore
    return { success: true, message: '' };
  }
  const currentAddress = provider.getAddress().address;
  if (currentAddress === '') {
    // TODO: should never happen. Not sure why we're checking this
    return errorFxn(PaimaMiddlewareErrorCode.NO_ADDRESS_SELECTED);
  }

  // TODO: more proper checking?

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
