export type ActionResult = BaseResult | FailedResult;
export type Result<T> = SuccessfulResult<T> | FailedResult;

interface BaseResult {
  success: boolean;
  message?: string;
}

export interface SuccessfulResult<T> extends BaseResult {
  success: true;
  result: T;
}

export interface FailedResult extends BaseResult {
  success: false;
  errorMessage: string;
  errorCode?: number;
}

export type QueryValue = string | number | boolean;
export type QueryOptions = Record<string, QueryValue>;

export interface Wallet {
  address: string;
}

export interface UserState {
  experience: number;
  wallet: string;
}
