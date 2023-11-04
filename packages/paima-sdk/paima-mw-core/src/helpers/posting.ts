import { retrieveFee, retryPromise, wait } from '@paima/utils';
import type { EndpointErrorFxn } from '../errors.js';
import {
  BatcherRejectionCode,
  buildEndpointErrorFxn,
  FE_ERR_BATCHER_LIMIT_REACHED,
  FE_ERR_BATCHER_REJECTED_INPUT,
  PaimaMiddlewareErrorCode,
} from '../errors.js';
import {
  getDefaultProvider,
  getEmulatedBlocksActive,
  getFee,
  getPostingMode,
  getStorageAddress,
  getWeb3,
  PostingMode,
  setFee,
} from '../state.js';
import type {
  BatcherPostResponse,
  BatcherTrackResponse,
  FailedResult,
  PostDataResponse,
  Result,
} from '../types.js';
import { batchedToJsonString, buildBatchedSubunit } from './data-processing.js';
import type { PostFxn } from './transaction-building.js';
import { buildDirectTx } from './transaction-building.js';
import { batcherQuerySubmitUserInput, batcherQueryTrackUserInput } from './query-constructors.js';
import { postDataToEndpoint } from './general.js';
import { pushLog } from './logging.js';
import {
  deploymentChainBlockHeightToEmulated,
  emulatedBlocksActiveOnBackend,
} from './auxiliary-queries.js';
import { EthersEvmProvider, EvmInjectedProvider, WalletModeMap } from '@paima/providers';
import type { WalletMode } from '@paima/providers';
import type { BatchedSubunit } from '@paima/concise';
import assertNever from 'assert-never';

const BATCHER_WAIT_PERIOD = 500;
const BATCHER_RETRIES = 50;

const TX_VERIFICATION_RETRY_DELAY = 1000;
const TX_VERIFICATION_DELAY = 1000;
const TX_VERIFICATION_RETRY_COUNT = 8;

function oneHourPassed(timestamp: number): boolean {
  const currTime = new Date().getTime();
  const diffSeconds = (currTime - timestamp) / 1000;
  return diffSeconds / 60 / 60 > 1;
}
export async function updateFee(): Promise<void> {
  try {
    // assume the fee doesn't change at runtime
    const prevFee = getFee();
    if (prevFee != null && !oneHourPassed(prevFee.lastFetch)) return;
    const web3 = await getWeb3();
    const newFee = await retrieveFee(getStorageAddress(), web3);
    setFee(newFee);
    pushLog(`[updateFee] retrieved fee ${newFee}, ${newFee.length} symbols`);
  } catch (err) {
    pushLog('[updateFee] error while updating fee:', err);
  }
}

/**
 * Wrapper around post concisely encoded data with added error handling
 * @param data Concisely encoded data to post
 * @param errorFxn Utility error function to handle error formatting
 * @returns blockheight or failure
 */
export const postConciseData = async (
  data: string,
  errorFxn: EndpointErrorFxn,
  mode?: WalletMode
): Promise<PostDataResponse | FailedResult> => {
  try {
    const response = await postConciselyEncodedData(data, mode);
    if (!response.success) {
      return errorFxn(
        PaimaMiddlewareErrorCode.ERROR_POSTING_TO_CHAIN,
        response.errorMessage,
        response.errorCode
      );
    }
    const blockHeight = response.result;

    if (blockHeight < 0) {
      return errorFxn(
        PaimaMiddlewareErrorCode.ERROR_POSTING_TO_CHAIN,
        `Received block height: ${blockHeight}`
      );
    }
    return { success: true, blockHeight };
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.ERROR_POSTING_TO_CHAIN, err);
  }
};

/**
 * @deprecated for outside use, utilize @see {postConciseData} instead
 * @param gameInput
 * @returns On success the block number of the transaction
 */
export async function postConciselyEncodedData(
  gameInput: string,
  mode?: WalletMode
): Promise<Result<number>> {
  const errorFxn = buildEndpointErrorFxn('postConciselyEncodedData');

  const provider = mode == null ? getDefaultProvider() : WalletModeMap[mode].getOrThrowProvider();
  if (provider == null) {
    const errorCode = PaimaMiddlewareErrorCode.WALLET_NOT_CONNECTED;
    return errorFxn(errorCode, 'Failed to get default provider');
  }
  const postingMode = getPostingMode(provider);
  if (postingMode == null) {
    return errorFxn(
      PaimaMiddlewareErrorCode.INTERNAL_INVALID_POSTING_MODE,
      `Invalid posting mode: ${postingMode}`
    );
  }

  switch (postingMode) {
    case PostingMode.UNBATCHED:
      if (provider instanceof EthersEvmProvider || provider instanceof EvmInjectedProvider) {
        return await postString(provider.sendTransaction, provider.getAddress().address, gameInput);
      }
      return errorFxn(
        PaimaMiddlewareErrorCode.INTERNAL_INVALID_POSTING_MODE,
        `Unbatched only supported for EVM wallets`
      );
    case PostingMode.BATCHED:
      return await buildBatchedSubunit(provider.signMessage, provider.getAddress(), gameInput).then(
        submitToBatcher
      );
    default:
      assertNever(postingMode, true);
      return errorFxn(
        PaimaMiddlewareErrorCode.INTERNAL_INVALID_POSTING_MODE,
        `Invalid posting mode: ${postingMode}`
      );
  }
}

async function getAdjustedHeight(deploymentChainBlockHeight: number): Promise<number> {
  const emulatedActive = getEmulatedBlocksActive() ?? (await emulatedBlocksActiveOnBackend());
  if (emulatedActive) {
    const BLOCK_DELAY = 1000;

    // TODO: magic number. -1 here means the block isn't part of the chain yet so we can't know the mapping
    let block = -1;
    while (block === -1) {
      block = await deploymentChainBlockHeightToEmulated(deploymentChainBlockHeight);
      if (block === -1) {
        await wait(BLOCK_DELAY);
      }
    }
    return block;
  } else {
    return deploymentChainBlockHeight;
  }
}

async function postString(
  sendWalletTransaction: PostFxn,
  userAddress: string,
  dataUtf8: string
): Promise<Result<number>> {
  const errorFxn = buildEndpointErrorFxn('postString');
  const tx = buildDirectTx(userAddress, 'paimaSubmitGameInput', dataUtf8);

  try {
    const txHash = await sendWalletTransaction(tx);
    const deploymentChainBlockHeight = await retryPromise(
      () => verifyTx(txHash, TX_VERIFICATION_DELAY),
      TX_VERIFICATION_RETRY_DELAY,
      TX_VERIFICATION_RETRY_COUNT
    );
    return {
      success: true,
      result: await getAdjustedHeight(deploymentChainBlockHeight),
    };
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.ERROR_POSTING_TO_CHAIN, err);
  }
}

// Verifies that the transaction took place and returns its block number on success
async function verifyTx(txHash: string, msTimeout: number): Promise<number> {
  const [_, web3] = await Promise.all([wait(msTimeout), getWeb3()]);
  const receipt = await web3.eth.getTransactionReceipt(txHash);
  return receipt.blockNumber;
}

async function submitToBatcher(subunit: BatchedSubunit): Promise<Result<number>> {
  const errorFxn = buildEndpointErrorFxn('submitToBatcher');

  const body = batchedToJsonString(subunit);
  let res: Response;

  try {
    const query = batcherQuerySubmitUserInput();
    res = await postDataToEndpoint(query, body);
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.ERROR_POSTING_TO_BATCHER);
  }

  let inputHash: string;

  try {
    const response = (await res.json()) as BatcherPostResponse;
    // TODO: proper error checking
    if (!response.success) {
      const msg = `Batcher rejected input "${body}" with response "${response.message}"`;
      const feErrorCode =
        response.code === BatcherRejectionCode.ADDRESS_NOT_ALLOWED
          ? FE_ERR_BATCHER_LIMIT_REACHED
          : FE_ERR_BATCHER_REJECTED_INPUT;
      return errorFxn(PaimaMiddlewareErrorCode.BATCHER_REJECTED_INPUT, msg, feErrorCode);
    }
    inputHash = response.hash;
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.INVALID_RESPONSE_FROM_BATCHER, err);
  }

  try {
    return await verifyBatcherSubmission(inputHash);
  } catch (err) {
    errorFxn(`Rejected input: "${body}"`);
    return errorFxn(PaimaMiddlewareErrorCode.FAILURE_VERIFYING_BATCHER_ACCEPTANCE, err);
  }
}

async function verifyBatcherSubmission(inputHash: string): Promise<Result<number>> {
  const errorFxn = buildEndpointErrorFxn('verifyBatcherSubmission');

  for (let i = 0; i < BATCHER_RETRIES; i++) {
    let res: Response;

    await wait(BATCHER_WAIT_PERIOD);

    try {
      const query = batcherQueryTrackUserInput(inputHash);
      res = await fetch(query);
    } catch (err) {
      errorFxn(PaimaMiddlewareErrorCode.ERROR_QUERYING_BATCHER_ENDPOINT, err);
      continue;
    }

    try {
      const status = (await res.json()) as BatcherTrackResponse;
      // TODO: proper error checking?
      if (status.status === 'rejected') {
        const msg = `Batcher rejected input with response "${status.message}"`;
        return errorFxn(
          PaimaMiddlewareErrorCode.BATCHER_REJECTED_INPUT,
          msg,
          FE_ERR_BATCHER_REJECTED_INPUT
        );
      } else if (status.status === 'posted') {
        return {
          success: true,
          result: await getAdjustedHeight(status.block_height),
        };
      }
    } catch (err) {
      errorFxn(PaimaMiddlewareErrorCode.INVALID_RESPONSE_FROM_BATCHER, err);
      continue;
    }
  }

  throw new Error('Batcher submission verification timeout');
}
