export type Hash = string;
export type URI = string;
export type EthAddress = Hash;
export type ContractAddress = EthAddress;

export interface InvalidInput {
  input: 'invalidString';
}
