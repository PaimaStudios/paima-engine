import type {
  ActiveConnection,
  GameInfo,
  IConnector,
  IInjectedConnector,
  IProvider,
} from './IProvider.js';
import assertNever from 'assert-never';
import { AlgorandConnector } from './algorand.js';
import { EthersConnector, EvmInjectedConnector } from './evm/index.js';
import { CardanoConnector } from './cardano.js';
import { PolkadotConnector } from './polkadot.js';
import { MinaConnector } from './mina.js';
import { AvailConnector } from './avail.js';

export const enum WalletMode {
  EvmInjected,
  EvmEthers,
  Cardano,
  Polkadot,
  Algorand,
  Mina,
  AvailJs,
}

export const WalletModeMap = {
  [WalletMode.EvmInjected]: EvmInjectedConnector.instance(),
  [WalletMode.EvmEthers]: EthersConnector.instance(),
  [WalletMode.Cardano]: CardanoConnector.instance(),
  [WalletMode.Polkadot]: PolkadotConnector.instance(),
  [WalletMode.Algorand]: AlgorandConnector.instance(),
  [WalletMode.Mina]: MinaConnector.instance(),
  [WalletMode.AvailJs]: AvailConnector.instance(),
};

type ExtractGeneric<T> = T extends IConnector<infer U> ? U : never;
export type ApiForMode<Mode extends WalletMode> = ExtractGeneric<(typeof WalletModeMap)[Mode]>;

export type InjectionPreference<T> =
  | {
      name: string;
    }
  | {
      connection: ActiveConnection<T>;
    };

export async function allInjectedWallets(gameInfo: GameInfo): Promise<{
  [WalletMode.EvmInjected]: ReturnType<typeof EvmInjectedConnector.getWalletOptions>;
  [WalletMode.Cardano]: ReturnType<typeof CardanoConnector.getWalletOptions>;
  [WalletMode.Polkadot]: Awaited<ReturnType<typeof PolkadotConnector.getWalletOptions>>;
  [WalletMode.Algorand]: ReturnType<typeof AlgorandConnector.getWalletOptions>;
  [WalletMode.Mina]: ReturnType<typeof MinaConnector.getWalletOptions>;
}> {
  return {
    [WalletMode.EvmInjected]: EvmInjectedConnector.getWalletOptions(),
    [WalletMode.Cardano]: CardanoConnector.getWalletOptions(),
    [WalletMode.Polkadot]: await PolkadotConnector.getWalletOptions(gameInfo.gameName),
    [WalletMode.Algorand]: AlgorandConnector.getWalletOptions(),
    [WalletMode.Mina]: MinaConnector.getWalletOptions(),
  };
}
export async function connectInjectedWallet<Api>(
  typeName: string,
  preference: undefined | InjectionPreference<Api>,
  connector: IInjectedConnector<Api>,
  gameInfo: GameInfo
): Promise<IProvider<Api>> {
  if (preference == null) {
    console.log(`${typeName} Attempting simple login`);
    const provider = await connector.connectSimple(gameInfo);
    return provider;
  } else if ('name' in preference) {
    const walletName = preference.name;
    console.log(`${typeName} Attempting to log into ${walletName}`);
    const provider = await connector.connectNamed(gameInfo, walletName);
    return provider;
  } else if ('connection' in preference) {
    const walletName = preference.connection.metadata.name;
    console.log(`${typeName} Attempting to log into ${walletName}`);
    const provider = await connector.connectExternal(gameInfo, preference.connection);
    return provider;
  }
  assertNever(preference);
}

export function callProvider<
  Mode extends WalletMode,
  Api extends ApiForMode<Mode>,
  Func extends keyof IProvider<Api>,
>(
  mode: Mode,
  funcName: Func,
  ...args: Parameters<IProvider<Api>[Func]>
): ReturnType<IProvider<Api>[Func]> {
  const provider = WalletModeMap[mode].getOrThrowProvider();
  const func = provider[funcName];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (func as any)(...args);
}
