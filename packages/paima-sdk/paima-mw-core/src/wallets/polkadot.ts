import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors';
import { getGameName } from '../state';
import type { LoginInfoMap, Result, Wallet } from '../types';
import { PolkadotConnector } from '@paima/providers';
import type { WalletMode } from './wallet-modes';
import { connectInjectedWallet } from './wallet-modes';

export async function polkadotLoginWrapper(
  loginInfo: LoginInfoMap[WalletMode.Polkadot]
): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('polkadotLoginWrapper');

  const gameInfo = {
    gameName: getGameName(),
    gameChainId: undefined, // Not needed because of batcher
  };
  const loginResult = await connectInjectedWallet(
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
    result: {
      walletAddress: loginResult.result.getAddress(),
    },
  };
}
