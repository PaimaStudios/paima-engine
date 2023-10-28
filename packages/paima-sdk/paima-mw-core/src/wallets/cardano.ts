import type { LoginInfoMap, OldResult, Result, Wallet } from '../types';
import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors';
import type { WalletMode } from './wallet-modes';
import { connectWallet } from './wallet-modes';
import { CardanoConnector } from '@paima/providers';
import { getGameName } from '../state';

export async function checkCardanoWalletStatus(): Promise<OldResult> {
  const errorFxn = buildEndpointErrorFxn('checkCardanoWalletStatus');

  const currentAddress = CardanoConnector.instance().getProvider()?.getAddress();
  if (currentAddress == null || currentAddress === '') {
    return errorFxn(PaimaMiddlewareErrorCode.NO_ADDRESS_SELECTED);
  }

  // TODO: more proper checking?

  return { success: true, message: '' };
}

export async function cardanoLoginWrapper(
  loginInfo: LoginInfoMap[WalletMode.CARDANO]
): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('cardanoLoginWrapper');

  const gameInfo = {
    gameName: getGameName(),
    gameChainId: undefined, // Not needed because of batcher
  };
  const loginResult = await connectWallet(
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
    result: {
      walletAddress: loginResult.result.getAddress(),
    },
  };
}
