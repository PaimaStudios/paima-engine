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

export type InputDataString = string;
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
  origin: {
    /** Transaction hash on the underlying triggered the STF (note: doesn't exist for timers) */
    txHash: null | string;
    /**
     * multichain identifier: https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md
     * note: `null` when this is a timer (since timers do not inherently have a chain of origin)
     */
    caip2: null | string;
    contractAddress: null | string;
    /** Name/id of the primitive that triggered this event, if known */
    primitiveName: null | string;
  };
}

export type NonTimerSubmittedData = SubmittedData & {
  origin: NonNullable<SubmittedData['origin']>;
};

export interface STFSubmittedData extends SubmittedData {
  /** Mapped address to main wallet. */
  userAddress: WalletAddress;
  /** Fixed User ID (starting with 1 for real users, and 0 in the case of a primitive) */
  userId: number;
  /** Paima L2 specific tx hash */
  paimaTxHash: string;
}

export type SubmittedChainData = SubmittedData;

export type PreExecutionBlockHeaderV1 = {
  mainChainBlochHash: string;
  blockHeight: number;
  /**
   * If there is no previous block, this is null
   */
  prevBlockHash: string | null;
  /** in milliseconds */
  msTimestamp: number;
};

type BlockVersions = 1;

type Max<N extends number, A extends any[] = []> = [N] extends [Partial<A>['length']]
  ? A['length']
  : Max<N, [0, ...A]>;

/**
 * Block header (see: ChainData for the full block)
 */
export type PerVersionPreExecutionBlockHeader<Version extends BlockVersions> = {
  version: Version;
} & (Version extends 1 ? PreExecutionBlockHeaderV1 : never);

/**
 * Modify the version number here when needed
 */
export type PreExecutionBlockHeader = PerVersionPreExecutionBlockHeader<Max<BlockVersions>>;

/**
 * Careful: update version number if this struct changes
 */
export type PostExecutionBlockHeader<Version extends BlockVersions> =
  PerVersionPreExecutionBlockHeader<Version> & {
    successTxsHash: string;
    /**
     * note: this may not contain all failed txs
     *       notably, it excludes any tx that failed before it got to the STF call
     */
    failedTxsHash: string;
  };
