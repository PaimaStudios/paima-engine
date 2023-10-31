import type { AddressType } from '@paima/utils';

export type UserSignature = string;

export type WalletOption = {
  name: string; // name of the wallet used in APIs (as opposed to a human-friendly string)
  displayName: string;
  /**
   * URI-encoded image
   * DANGER: SVGs can contain Javascript, so these should only be rendered with <img> tags
   *
   * Note: not every wallet type has an image (ex: locally generated keypairs)
   * Example values:
   * data:image/svg+xml,...
   * data:image/png;base64,...
   */
  icon?: undefined | string;
};

export type ActiveConnection<T> = {
  metadata: WalletOption;
  api: T;
};
export type ConnectionOption<T> = {
  metadata: WalletOption;
  api: () => Promise<T>;
};
export async function optionToActive<T>(option: ConnectionOption<T>): Promise<ActiveConnection<T>> {
  const connection = {
    metadata: option.metadata,
    api: await option.api(),
  };
  return connection;
}

export type GameInfo = {
  gameName: string;
  /** undefined is for when we don't care which network we connect to */
  gameChainId: string | undefined;
};

export interface IConnector<T> {
  /** connect while letting Paima pick all the connection logic for you */
  connectSimple(gameInfo: GameInfo): Promise<IProvider<T>>;
  /** connect to an explicit API that Paima supports */
  connectNamed(gameInfo: GameInfo, name: string): Promise<IProvider<T>>;
  /** connect to an API that you've initialized yourself externally */
  connectExternal(gameInfo: GameInfo, conn: ActiveConnection<T>): Promise<IProvider<T>>;

  getProvider(): undefined | IProvider<T>;
  getOrThrowProvider(): IProvider<T>;
  isConnected(): boolean;
}

export type AddressAndType = {
  type: AddressType;
  address: string;
};
export interface IProvider<T> {
  getConnection(): ActiveConnection<T>;
  signMessage(message: string): Promise<UserSignature>;
  getAddress(): AddressAndType;
}
