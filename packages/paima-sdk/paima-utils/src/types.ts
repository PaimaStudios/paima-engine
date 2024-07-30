export type Deployment = 'C1' | 'A1';

export type ErrorCode = number;
export type ErrorMessageFxn = (errorCode: ErrorCode) => string;
export type ErrorMessageMapping = Record<ErrorCode, string>;

// TOOD: remove?
export type ETHAddress = string;
export type CardanoAddress = string;
export type PolkadotAddress = string;
export type AlgorandAddress = string;
export type MinaAddress = string;

export type WalletAddress =
  | ETHAddress
  // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents -- the overlapping types is on purpose for readability
  | CardanoAddress
  // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents -- the overlapping types is on purpose for readability
  | PolkadotAddress
  // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents -- the overlapping types is on purpose for readability
  | AlgorandAddress
  // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents -- the overlapping types is on purpose for readability
  | MinaAddress;

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
  /** Address of the wallet that submitted the data (0x0 in the case of a primitive). */
  realAddress: WalletAddress;
  /** STF input */
  inputData: InputDataString;
  inputNonce: NonceString;
  /** any native token sent to the L2 contract. 0 if this is not a direct user transaction  */
  suppliedValue: string;
  /** whether or not this came from an primitive/timer or a direct user transaction */
  scheduled: boolean;
  dryRun?: boolean;
  /** multichain identifier: https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md */
  caip2: string;
  /** See docs for how this is calculated */
  txHash: string;
}

export interface STFSubmittedData extends SubmittedData {
  /** Mapped address to main wallet. */
  userAddress: WalletAddress;
  /** Fixed User ID (starting with 1 for real users, and 0 in the case of a primitive) */
  userId: number;
  /** Transaction hash of Primitive that triggered this scheduled data, if known. */
  scheduledTxHash?: string;
  /** Name/id of the extension that triggered this event, if known */
  extensionName?: string;
}

export type SubmittedChainData = SubmittedData;
