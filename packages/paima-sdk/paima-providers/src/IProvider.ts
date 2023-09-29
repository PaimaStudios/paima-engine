export type UserSignature = string;

export type ActiveConnection<T> = {
  metadata: {
    // TODO: should also expose the icon for the wallet
    name: string;
  };
  api: T;
};

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
export interface IProvider<T> {
  getConnection(): ActiveConnection<T>;
  signMessage(message: string): Promise<UserSignature>;
  getAddress(): string;
}
