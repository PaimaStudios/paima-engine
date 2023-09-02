export type UserSignature = string;

export type ActiveConnection<T> = {
  metadata: {
    // TODO: should also expose the icon for the wallet
    name: string;
  };
  api: T;
};

export interface IConnector<T> {
  /** connect while letting Paima pick all the connection logic for you */
  connectSimple(): Promise<void>;
  /** connect to an explicit API that Paima supports */
  connectNamed(name: string): Promise<void>;
  /** connect to an API that you've initialized yourself externally */
  connectExternal(conn: ActiveConnection<T>): Promise<void>;

  getProvider(): undefined | IProvider<T>;
  isConnected(): boolean;
}
export interface IProvider<T> {
  getConnection(): ActiveConnection<T>;
  signMessage(userAddress: string, message: string): Promise<UserSignature>;
  getAddress(): string;
}
