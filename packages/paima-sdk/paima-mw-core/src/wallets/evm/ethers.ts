import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../../errors.js';
import { getChainId, getGameName } from '../../state.js';
import type { LoginInfoMap, Result } from '../../types.js';
import { updateFee } from '../../helpers/posting.js';

import type { ApiForMode, EthersApi, IProvider, WalletMode } from '@paima/providers';
import { EthersConnector } from '@paima/providers';

async function connectWallet(
  loginInfo: LoginInfoMap[WalletMode.EvmEthers]
): Promise<Result<IProvider<EthersApi>>> {
  const errorFxn = buildEndpointErrorFxn('ethersLoginWrapper');

  const gameInfo = {
    gameName: getGameName(),
    gameChainId: '0x' + getChainId().toString(16),
  };
  const name = loginInfo.connection.metadata.name;
  try {
    console.log(`ethersLoginWrapper: Attempting to log into ${name}`);
    const provider = await EthersConnector.instance().connectExternal(
      gameInfo,
      loginInfo.connection.api
    );
    return {
      success: true,
      result: provider,
    };
  } catch (err) {
    console.log(`ethersLoginWrapper: Error while logging into wallet name}`);

    return errorFxn(PaimaMiddlewareErrorCode.EVM_LOGIN, err);
  }
}
export async function ethersLoginWrapper(
  loginInfo: LoginInfoMap[WalletMode.EvmEthers]
): Promise<Result<IProvider<ApiForMode<WalletMode.Cardano>>>> {
  const errorFxn = buildEndpointErrorFxn('ethersLoginWrapper');

  const loginResult = await connectWallet(loginInfo);
  if (loginResult.success === false) {
    return loginResult;
  }

  try {
    await updateFee();
  } catch (err) {
    errorFxn(PaimaMiddlewareErrorCode.ERROR_UPDATING_FEE, err);
    // The fee has a default value, so this is not fatal and we can continue.
    // If the fee has increased beyond the default value, posting won't work.
  }

  return {
    success: true,
    result: loginResult.result,
  };
}
