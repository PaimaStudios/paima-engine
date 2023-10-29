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
} from '@paima/providers';
import { WalletNotFound, UnsupportedWallet } from '@paima/providers';
import type { EndpointErrorFxn } from '../errors';
import type { Result } from '../types';
import type { PaimaMiddlewareErrorCode } from '../errors';
import { FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED } from '../errors';
import assertNever from 'assert-never';

export const enum WalletMode {
  NoWallet,
  EvmInjected,
  EvmEthers,
  Cardano,
  Polkadot,
  Algorand,
}

export type InjectionPreference<T> =
  | {
      name: string;
    }
  | {
      connection: ActiveConnection<T>;
    };

export type BaseLoginInfo<Api> = {
  preference?: InjectionPreference<Api>;
};
export type LoginInfoMap = {
  [WalletMode.EvmInjected]: BaseLoginInfo<EvmApi> & { preferBatchedMode: boolean };
  [WalletMode.EvmEthers]: { connection: ActiveConnection<EthersApi>; preferBatchedMode: boolean };
  [WalletMode.Cardano]: BaseLoginInfo<CardanoApi>;
  [WalletMode.Polkadot]: BaseLoginInfo<PolkadotApi>;
  [WalletMode.Algorand]: BaseLoginInfo<AlgorandApi>;
  [WalletMode.NoWallet]: void;
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
export async function connectInjectedWallet<Api>(
  typeName: string,
  errorFxn: EndpointErrorFxn,
  errorCode: PaimaMiddlewareErrorCode,
  loginInfo: BaseLoginInfo<Api>,
  connector: IConnector<Api>,
  gameInfo: GameInfo
): Promise<Result<IProvider<Api>>> {
  try {
    if (loginInfo.preference == null) {
      console.log(`${typeName} Attempting simple login`);
      const provider = await connector.connectSimple(gameInfo);
      return {
        success: true,
        result: provider,
      };
    } else if ('name' in loginInfo.preference) {
      const walletName = loginInfo.preference.name;
      console.log(`${typeName} Attempting to log into ${walletName}`);
      const provider = await connector.connectNamed(gameInfo, walletName);
      return {
        success: true,
        result: provider,
      };
    } else if ('connection' in loginInfo.preference) {
      const walletName = loginInfo.preference.connection.metadata.name;
      console.log(`${typeName} Attempting to log into ${walletName}`);
      const provider = await connector.connectExternal(gameInfo, loginInfo.preference.connection);
      return {
        success: true,
        result: provider,
      };
    } else {
      assertNever(loginInfo.preference);
    }
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
