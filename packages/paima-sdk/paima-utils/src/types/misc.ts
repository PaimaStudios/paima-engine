// TODO: delete
export type Deployment = 'C1' | 'A1';

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

/**
 * Block header (see: ChainData for the full block)
 */
export type PreExecutionBlockHeader = {
  version: 1;
  mainChainBlochHash: string;
  blockHeight: number;
  /**
   * If there is no previous block, this is null
   */
  prevBlockHash: string | null;
  /** in milliseconds */
  msTimestamp: number;
};
export type PostExecutionBlockHeader = PreExecutionBlockHeader & {
  successTxsHash: string;
  /**
   * note: this may not contain all failed txs
   *       notably, it excludes any tx that failed before it got to the STF call
   */
  failedTxsHash: string;
};

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
  /**
   * multichain identifier: https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md
   * note: `null` when this is a timer (since timers do not inherently have a chain of origin)
   */
  caip2: null | string;
  /** See docs for how this is calculated */
  txHash: string;
}

/**
 * When it's not a timer, the caip2 field is required
 */
export type NonTimerSubmittedData = SubmittedData & { caip2: NonNullable<SubmittedData['caip2']> };

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
