import type { ActiveConnection, GameInfo, IConnector, IProvider } from './IProvider';
import assertNever from 'assert-never';
import { AlgorandConnector } from './algorand';
import { EvmInjectedConnector } from './evm';
import { CardanoConnector } from './cardano';
import { PolkadotConnector } from './polkadot';

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

export async function allInjectedWallets(gameInfo: GameInfo): Promise<{
  [WalletMode.EvmInjected]: ReturnType<typeof EvmInjectedConnector.getWalletOptions>,
  [WalletMode.Cardano]: ReturnType<typeof CardanoConnector.getWalletOptions>,
  [WalletMode.Polkadot]: Awaited<ReturnType<typeof PolkadotConnector.getWalletOptions>>,
  [WalletMode.Algorand]: ReturnType<typeof AlgorandConnector.getWalletOptions>,
}> {
  return {
    [WalletMode.EvmInjected]: EvmInjectedConnector.getWalletOptions(),
    [WalletMode.Cardano]: CardanoConnector.getWalletOptions(),
    [WalletMode.Polkadot]: await PolkadotConnector.getWalletOptions(gameInfo.gameName),
    [WalletMode.Algorand]: AlgorandConnector.getWalletOptions(),
  }
}
export async function connectInjectedWallet<Api>(
  typeName: string,
  preference: undefined | InjectionPreference<Api>,
  connector: IConnector<Api>,
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
