import type { Hash, WalletAddress, UserSignature } from '@paima/utils';
export type * from './wallets/wallet-modes';

export interface PostingInfo {
  address: WalletAddress;
  postingModeString: PostingModeString;
}

export type PostingModeString =
  | 'unbatched'
  | 'batched-eth'
  | 'batched-cardano'
  | 'batched-polkadot'
  | 'batched-algorand'
  | 'automatic';

export type PostingModeSwitchResult = PostingModeSwitchSuccessfulResult | FailedResult;

interface PostingModeSwitchSuccessfulResult extends PostingInfo {
  success: true;
}

export type SignFunction = (message: string) => Promise<UserSignature>;

export interface SuccessfulResultMessage {
  success: true;
  message: string;
}

export interface SuccessfulResult<T> {
  success: true;
  result: T;
}

export interface FailedResult {
  success: false;
  errorMessage: string;
  errorCode: number;
}

export type QueryValue = string | number | boolean;
export type QueryOptions = Record<string, QueryValue>;

export type Result<T> = SuccessfulResult<T> | FailedResult;
export type OldResult = SuccessfulResultMessage | FailedResult;

export interface Wallet {
  walletAddress: WalletAddress;
}

interface BatcherPostResponseSuccessful {
  success: true;
  hash: Hash;
}

interface BatcherPostResponseUnsuccessful {
  success: false;
  message: string;
  code?: number;
}

export type BatcherPostResponse = BatcherPostResponseSuccessful | BatcherPostResponseUnsuccessful;

interface BatcherTrackResponseCore {
  success: true;
  hash: Hash;
}

interface BatcherTrackResponsePosted extends BatcherTrackResponseCore {
  status: 'posted';
  block_height: number;
  transaction_hash: Hash;
}

interface BatcherTrackResponseRejected extends BatcherTrackResponseCore {
  status: 'rejected';
  message: string;
}

interface BatcherTrackResponseOther extends BatcherTrackResponseCore {
  status: 'accepted' | 'validating';
}

export type BatcherTrackResponse =
  | BatcherTrackResponsePosted
  | BatcherTrackResponseRejected
  | BatcherTrackResponseOther;

export type BaseSuccessResponse = {
  success: true;
};

export type PostDataResponse = BaseSuccessResponse & { blockHeight: number };
