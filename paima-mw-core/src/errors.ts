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

export const enum PaimaMiddlewareErrorCode {
  OK,
  UNKNOWN,
  // Account related:
  EVM_WALLET_NOT_INSTALLED,
  EVM_LOGIN,
  EVM_WRONG_CHAIN,
  EVM_CHAIN_SWITCH,
  EVM_CHAIN_VERIFICATION,
  NO_ADDRESS_SELECTED,
  BACKEND_VERSION_INCOMPATIBLE,
  ERROR_UPDATING_FEE,
  WALLET_NOT_CONNECTED,
  ERROR_SWITCHING_TO_CHAIN,
  ERROR_ADDING_CHAIN,
  WALLET_NOT_SUPPORTED,
  CARDANO_WALLET_NOT_INSTALLED,
  CARDANO_LOGIN,
  POLKADOT_WALLET_NOT_INSTALLED,
  POLKADOT_LOGIN,
  ALGORAND_LOGIN,
  TRUFFLE_LOGIN,
  // Input posting related:
  ERROR_POSTING_TO_CHAIN,
  ERROR_POSTING_TO_BATCHER,
  BATCHER_REJECTED_INPUT,
  INVALID_RESPONSE_FROM_BATCHER,
  FAILURE_VERIFYING_BATCHER_ACCEPTANCE,
  // Query endpoint related:
  ERROR_QUERYING_BACKEND_ENDPOINT,
  ERROR_QUERYING_BATCHER_ENDPOINT,
  INVALID_RESPONSE_FROM_BACKEND,
  // Internal, should never occur:
  INTERNAL_INVALID_DEPLOYMENT,
  INTERNAL_INVALID_POSTING_MODE,
  FINAL_PAIMA_GENERIC_ERROR, // only to be used as a counter
}

export const PAIMA_MIDDLEWARE_ERROR_MESSAGES: Record<PaimaMiddlewareErrorCode, string> = {
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
    let errorOccured: boolean = false;

    if (typeof errorDescription === 'string') {
      msg = errorDescription;
      errorOccured = msg !== '';
    } else {
      const errorCode = errorDescription;
      errorOccured = errorCode !== 0;
      msg = errorMessageFxn(errorCode);
    }

    if (errorOccured) {
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
