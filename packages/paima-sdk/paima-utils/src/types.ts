export type Deployment = 'C1' | 'A1';

export type ErrorCode = number;
export type ErrorMessageFxn = (errorCode: ErrorCode) => string;
export type ErrorMessageMapping = Record<ErrorCode, string>;

// TOOD: remove?
export type ETHAddress = string;
export type CardanoAddress = string;
export type PolkadotAddress = string;
export type AlgorandAddress = string;

// eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents -- the overlapping types is on purpose for readability
export type WalletAddress = ETHAddress | CardanoAddress | PolkadotAddress | AlgorandAddress;

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

export type NonceString = string;

export interface SubmittedData {
  userAddress: WalletAddress;
  inputData: InputDataString;
  inputNonce: NonceString;
  suppliedValue: string;
  scheduled: boolean;
  dryRun?: boolean;
}
export type SubmittedChainData = SubmittedData;
