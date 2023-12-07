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
import type { EndpointErrorFxn } from '../errors.js';
import type { Result } from '../types.js';
import type { PaimaMiddlewareErrorCode } from '../errors.js';
import { FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED } from '../errors.js';

export type BaseLoginInfo<Api> = {
  preference?: InjectionPreference<Api>;
};
export type LoginInfoMap = {
  [WalletMode.EvmInjected]: BaseLoginInfo<EvmApi> & {
    /** If true even EVM wallet inputs will be batched (sign data and send to the batcher) */
    preferBatchedMode: boolean;
    /**
     * By default, Paima will try and switch the wallet's network to the one used for the game
     * This uses EIP3326 (https://eips.ethereum.org/EIPS/eip-3326)
     * This may not be desired, since not all wallets support switching to an arbitrary network
     * Set to false if you only need to sign data. Otherwise, keep as true
     * @default true
     */
    checkChainId?: boolean;
  };
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
