import { GlobalConfig } from '@paima/utils';
import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../errors.js';
import { getGameName } from '../state.js';
import type { LoginInfoMap } from '../types.js';
import type { ApiForMode, AvailJsApi, IProvider, WalletMode } from '@paima/providers';
import { AvailConnector } from '@paima/providers';
import { Keyring } from 'avail-js-sdk';
import type { Result } from '@paima/utils';

async function connectWallet(
  loginInfo: LoginInfoMap[WalletMode.AvailJs]
): Promise<Result<IProvider<AvailJsApi>>> {
  const errorFxn = buildEndpointErrorFxn('availJsLoginWrapper');

  try {
    const availConfig =
      (await GlobalConfig.mainAvailConfig()) ?? (await GlobalConfig.otherAvailConfig());
    if (availConfig == null) {
      return errorFxn(
        PaimaMiddlewareErrorCode.POLKADOT_LOGIN,
        new Error(`No Avail network found in configuration`)
      );
    }
    const [_, config] = availConfig;
    const gameInfo = {
      gameName: getGameName(),
      gameChainId: '0x' + config.genesisHash.slice(2, 32 + 2),
    };
    const name = loginInfo.connection.metadata.name;

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

    return errorFxn(PaimaMiddlewareErrorCode.POLKADOT_LOGIN, err);
  }
}
export async function availJsLoginWrapper(
  loginInfo: LoginInfoMap[WalletMode.AvailJs]
): Promise<Result<IProvider<ApiForMode<WalletMode.AvailJs>>>> {
  const loginResult = await connectWallet(loginInfo);

  return loginResult;
}
