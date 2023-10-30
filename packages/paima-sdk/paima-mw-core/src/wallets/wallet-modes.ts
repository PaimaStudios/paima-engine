import type {
  ActiveConnection,
  EvmApi,
  CardanoApi,
  AlgorandApi,
  PolkadotApi,
  IConnector,
  IProvider,
  GameInfo,
  EthersApi,
  InjectionPreference,
  WalletMode,
} from '@paima/providers';
import { WalletNotFound, UnsupportedWallet, connectInjectedWallet } from '@paima/providers';
import type { EndpointErrorFxn } from '../errors';
import type { Result } from '../types';
import type { PaimaMiddlewareErrorCode } from '../errors';
import { FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED } from '../errors';

export type BaseLoginInfo<Api> = {
  preference?: InjectionPreference<Api>;
};
export type LoginInfoMap = {
  [WalletMode.EvmInjected]: BaseLoginInfo<EvmApi> & { preferBatchedMode: boolean };
  [WalletMode.EvmEthers]: { connection: ActiveConnection<EthersApi>; preferBatchedMode: boolean };
  [WalletMode.Cardano]: BaseLoginInfo<CardanoApi>;
  [WalletMode.Polkadot]: BaseLoginInfo<PolkadotApi>;
  [WalletMode.Algorand]: BaseLoginInfo<AlgorandApi>;
};

type ToUnion<T> = {
  [K in keyof T]: { mode: K } & T[K];
}[keyof T];

export type LoginInfo = ToUnion<LoginInfoMap>;

function getWalletName(info: BaseLoginInfo<unknown>): undefined | string {
  if (info.preference == null) return undefined;
  if ('name' in info.preference) {
    return info.preference.name;
  }
  return info.preference.connection.metadata.name;
}
export async function connectInjected<Api>(
  typeName: string,
  errorFxn: EndpointErrorFxn,
  errorCode: PaimaMiddlewareErrorCode,
  loginInfo: BaseLoginInfo<Api>,
  connector: IConnector<Api>,
  gameInfo: GameInfo
): Promise<Result<IProvider<Api>>> {
  try {
    const provider = await connectInjectedWallet(
      typeName,
      loginInfo.preference,
      connector,
      gameInfo
    );
    return {
      success: true,
      result: provider,
    };
  } catch (err) {
    if (err instanceof WalletNotFound || err instanceof UnsupportedWallet) {
      return errorFxn(errorCode, undefined, FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED);
    }
    console.log(
      `${typeName} Error while logging into wallet ${getWalletName(loginInfo) ?? 'simple'}`
    );

    return errorFxn(errorCode, err);
  }
}
