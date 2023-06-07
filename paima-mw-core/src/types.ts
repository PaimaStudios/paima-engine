import type { MetaMaskInpageProvider } from '@metamask/providers';
import type { PeraWalletConnect } from "@perawallet/connect";
import type {
  AddressType,
  Hash,
  WalletAddress,
  UserSignature,
  InputDataString,
} from '@paima/utils';

export interface BatchedSubunit {
  addressType: AddressType;
  userAddress: WalletAddress;
  userSignature: UserSignature;
  gameInput: InputDataString;
  millisecondTimestamp: string;
}

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

export type SignFunction = (userAddress: WalletAddress, message: string) => Promise<UserSignature>;

export type CardanoApi = any;
export type EvmApi = MetaMaskInpageProvider | undefined;
export type AlgorandApi = PeraWalletConnect | undefined;

export type PolkadotSignFxn = any;

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
