import { buildErrorCodeTranslator } from '@paima/utils';
import type { ErrorCode, ErrorMessageFxn } from '@paima/utils';
import { pushLog } from './helpers/logging';
import type { FailedResult } from './types';

export type EndpointErrorFxn = (
  errorDescription: ErrorCode | string,
  err?: any,
  errorCode?: number
) => FailedResult;

// specific batcher error codes
export const enum BatcherRejectionCode {
  ADDRESS_NOT_ALLOWED = 4,
}

export const FE_ERR_OK = 0;
export const FE_ERR_GENERIC = 1;
export const FE_ERR_METAMASK_NOT_INSTALLED = 2;
export const FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED = 3;
export const FE_ERR_BATCHER_REJECTED_INPUT = 4;
export const FE_ERR_BATCHER_LIMIT_REACHED = 5;

// We don't use enum here as we need these to be constants (an enums (even `const enum`) are not constants when exported with `preserveConstEnums` from a library
export const PaimaMiddlewareErrorCode = {
  OK: 0,
  UNKNOWN: 1,
  // Account related:
  EVM_WALLET_NOT_INSTALLED: 1_000,
  EVM_LOGIN: 1_001,
  EVM_WRONG_CHAIN: 1_002,
  EVM_CHAIN_SWITCH: 1_003,
  EVM_CHAIN_VERIFICATION: 1_004,
  NO_ADDRESS_SELECTED: 1_005,
  BACKEND_VERSION_INCOMPATIBLE: 1_006,
  ERROR_UPDATING_FEE: 1_007,
  WALLET_NOT_CONNECTED: 1_008,
  ERROR_SWITCHING_TO_CHAIN: 1_009,
  ERROR_ADDING_CHAIN: 1_010,
  WALLET_NOT_SUPPORTED: 1_011,
  CARDANO_WALLET_NOT_INSTALLED: 1_012,
  CARDANO_LOGIN: 1_013,
  POLKADOT_WALLET_NOT_INSTALLED: 1_014,
  POLKADOT_LOGIN: 1_015,
  ALGORAND_LOGIN: 1_016,
  TRUFFLE_LOGIN: 1_017,
  // Input posting related:
  ERROR_POSTING_TO_CHAIN: 2_000,
  ERROR_POSTING_TO_BATCHER: 2_001,
  BATCHER_REJECTED_INPUT: 2_002,
  INVALID_RESPONSE_FROM_BATCHER: 2_003,
  FAILURE_VERIFYING_BATCHER_ACCEPTANCE: 2_004,
  // Query endpoint related:
  ERROR_QUERYING_BACKEND_ENDPOINT: 3_000,
  ERROR_QUERYING_BATCHER_ENDPOINT: 3_001,
  INVALID_RESPONSE_FROM_BACKEND: 3_002,
  // Internal, should never occur:
  INTERNAL_INVALID_DEPLOYMENT: 4_000,
  INTERNAL_INVALID_POSTING_MODE: 4_000,
  // only to be used as a starting point for user-defined error codes
  FINAL_PAIMA_GENERIC_ERROR: 1_000_000,
} as const;

export const PAIMA_MIDDLEWARE_ERROR_MESSAGES: Record<
  (typeof PaimaMiddlewareErrorCode)[keyof typeof PaimaMiddlewareErrorCode],
  string
> = {
  [PaimaMiddlewareErrorCode.OK]: '',
  [PaimaMiddlewareErrorCode.UNKNOWN]: 'Unknown error',
  [PaimaMiddlewareErrorCode.EVM_WALLET_NOT_INSTALLED]: 'Selected EVM wallet not installed',
  [PaimaMiddlewareErrorCode.EVM_LOGIN]: 'Unable to log into selected EVM wallet',
  [PaimaMiddlewareErrorCode.EVM_CHAIN_SWITCH]: 'Error while switching EVM wallet chain',
  [PaimaMiddlewareErrorCode.EVM_CHAIN_VERIFICATION]: 'EVM wallet chain verification failed',
  [PaimaMiddlewareErrorCode.EVM_WRONG_CHAIN]: 'Wrong chain currently selected in EVM wallet',
  [PaimaMiddlewareErrorCode.NO_ADDRESS_SELECTED]:
    'User has no address set, probably due to switching it in the wallet',
  [PaimaMiddlewareErrorCode.BACKEND_VERSION_INCOMPATIBLE]:
    'Backend version incompatible with middleware version',
  [PaimaMiddlewareErrorCode.ERROR_UPDATING_FEE]: 'Error updating fee',
  [PaimaMiddlewareErrorCode.WALLET_NOT_CONNECTED]: 'The user wallet has not yet been connected',
  [PaimaMiddlewareErrorCode.ERROR_SWITCHING_TO_CHAIN]:
    'Error while switching wallet to target chain',
  [PaimaMiddlewareErrorCode.ERROR_ADDING_CHAIN]: 'Error while adding target chain to wallet',
  [PaimaMiddlewareErrorCode.WALLET_NOT_SUPPORTED]: 'The selected wallet is not supported',
  [PaimaMiddlewareErrorCode.CARDANO_WALLET_NOT_INSTALLED]: 'No Cardano wallet installed',
  [PaimaMiddlewareErrorCode.CARDANO_LOGIN]: 'Error while connecting to the Cardano wallet',
  [PaimaMiddlewareErrorCode.POLKADOT_WALLET_NOT_INSTALLED]: 'No Polkadot wallet installed',
  [PaimaMiddlewareErrorCode.POLKADOT_LOGIN]: 'Error while connecting to the Polkadot wallet',
  [PaimaMiddlewareErrorCode.ALGORAND_LOGIN]: 'Error while connecting to the Algorand wallet',
  [PaimaMiddlewareErrorCode.TRUFFLE_LOGIN]: 'Error while connecting the Truffle HDWallet',
  [PaimaMiddlewareErrorCode.ERROR_POSTING_TO_CHAIN]:
    'An error occured while posting data to the blockchain',
  [PaimaMiddlewareErrorCode.ERROR_POSTING_TO_BATCHER]:
    'An error occured while posting data to the batcher',
  [PaimaMiddlewareErrorCode.BATCHER_REJECTED_INPUT]: 'The input was not accepted by the batcher',
  [PaimaMiddlewareErrorCode.INVALID_RESPONSE_FROM_BATCHER]:
    'Invalid response received from batcher',
  [PaimaMiddlewareErrorCode.FAILURE_VERIFYING_BATCHER_ACCEPTANCE]:
    'Failure verifying if the input was accepted by the batcher',
  [PaimaMiddlewareErrorCode.ERROR_QUERYING_BACKEND_ENDPOINT]:
    'An error occured while querying a backend endpoint',
  [PaimaMiddlewareErrorCode.ERROR_QUERYING_BATCHER_ENDPOINT]:
    'An error occured while querying a batcher endpoint',
  [PaimaMiddlewareErrorCode.INVALID_RESPONSE_FROM_BACKEND]:
    'Invalid response received from the backend',
  [PaimaMiddlewareErrorCode.INTERNAL_INVALID_DEPLOYMENT]: 'Internal error: Invalid deployment set',
  [PaimaMiddlewareErrorCode.INTERNAL_INVALID_POSTING_MODE]:
    'Internal error: Invalid posting mode set',
  [PaimaMiddlewareErrorCode.FINAL_PAIMA_GENERIC_ERROR]:
    'Internal error: unknown generic paima error (FINAL_PAIMA_GENERIC_ERROR)',
};

export const paimaErrorMessageFxn: ErrorMessageFxn = buildErrorCodeTranslator(
  PAIMA_MIDDLEWARE_ERROR_MESSAGES
);

export function buildAbstractEndpointErrorFxn(
  errorMessageFxn: ErrorMessageFxn,
  endpointName: string
): EndpointErrorFxn {
  return function (errorDescription: ErrorCode | string, err?: any, errorCode?: number) {
    let msg: string = '';
    let errorOccurred: boolean = false;

    if (typeof errorDescription === 'string') {
      msg = errorDescription;
      errorOccurred = msg !== '';
    } else {
      const errorCode = errorDescription;
      errorOccurred = errorCode !== 0;
      msg = errorMessageFxn(errorCode);
    }

    if (errorOccurred) {
      pushLog(`[${endpointName}] ${msg}`);
    }
    if (err) {
      pushLog(`[${endpointName}] error:`, err);
    }
    return {
      success: false,
      errorMessage: msg,
      errorCode: errorCode ? errorCode : FE_ERR_GENERIC,
    };
  };
}

export function buildEndpointErrorFxn(endpointName: string): EndpointErrorFxn {
  return buildAbstractEndpointErrorFxn(paimaErrorMessageFxn, endpointName);
}
