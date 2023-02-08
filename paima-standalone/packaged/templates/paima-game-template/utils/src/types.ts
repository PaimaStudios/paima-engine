export type Hash = string;
export type URI = string;
export type ISO8601Date = string;
export type CardanoAddress = Hash;
export type EthAddress = Hash;
export type Address = CardanoAddress | EthAddress;
export type UserAddress = Address;
export type ContractAddress = EthAddress;
export type UserSignature = Hash;
export type GameInput = string;

export interface MatchConfig {
  //TODO:
}

export interface MatchState {
  //TODO
}
export type Wallet = string;

export interface PlayersState {
  user1: PlayerState;
  user2: PlayerState;
}
interface PlayerState {
  wallet: string;
  health: number;
  position: number;
}

export interface InvalidInput {
  input: 'invalidString';
}

export type LobbyStatus = 'open' | 'active' | 'finished' | 'closed';
