export type Deployment = 'C1' | 'A1';

export type ErrorCode = number;
export type ErrorMessageFxn = (errorCode: ErrorCode) => string;
export type ErrorMessageMapping = Record<ErrorCode, string>;

export type ETHAddress = string;
export type CardanoAddress = string;
export type PolkadotAddress = string;
export type WalletAddress = ETHAddress | CardanoAddress | PolkadotAddress;

export type ContractAddress = ETHAddress;

export type Hash = string;
export type URI = string;
export type UserSignature = string;

export type InputDataString = string;

export type VersionString = `${number}.${number}.${number}`;

export type TransactionTemplate = {
  data: string;
  to: string;
  gasPrice: string;
};
