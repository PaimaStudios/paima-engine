import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors.js';
import { getChainId, getGameName } from '../state.js';
import type { LoginInfoMap, Result } from '../types.js';
import type { ApiForMode, AvailJsApi, IProvider, WalletMode } from '@paima/providers';
import { AvailConnector } from '@paima/providers';
import { Keyring, ApiPromise } from 'avail-js-sdk';

async function connectWallet(
  loginInfo: LoginInfoMap[WalletMode.AvailJs]
): Promise<Result<IProvider<AvailJsApi>>> {
  const errorFxn = buildEndpointErrorFxn('ethersLoginWrapper');

  const gameInfo = {
    gameName: getGameName(),
    gameChainId: '0x' + getChainId().toString(16),
  };
  const name = loginInfo.connection.metadata.name;
  try {
    console.log(`availJsLoginWrapper: Attempting to log into ${name}`);
    const keyring = new Keyring({ type: 'sr25519' });
    keyring.addFromUri(loginInfo.seed);

    const provider = await AvailConnector.instance().connectExternal(gameInfo, {
      rpc: loginInfo.connection.api,
      keyring: keyring,
    });

    return {
      success: true,
      result: provider,
    };
  } catch (err) {
    console.log(`availJsLoginWrapper: Error while logging into wallet name}`);

    return errorFxn(PaimaMiddlewareErrorCode.EVM_LOGIN, err);
  }
}
export async function availJsLoginWrapper(
  loginInfo: LoginInfoMap[WalletMode.AvailJs]
): Promise<Result<IProvider<ApiForMode<WalletMode.AvailJs>>>> {
  const loginResult = await connectWallet(loginInfo);

  return loginResult;
}
