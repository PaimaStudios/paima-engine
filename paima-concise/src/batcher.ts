import type { AddressType, WalletAddress, UserSignature, InputDataString } from '@paima/utils';
import { sha3, toBN } from 'web3-utils';

export const OUTER_BATCH_DIVIDER: string = '\x02';
export const INNER_BATCH_DIVIDER: string = '\x03';
export const BATCH_PREFIX = 'B';

export interface BatchedSubunit {
  addressType: AddressType;
  userAddress: WalletAddress;
  userSignature: UserSignature;
  gameInput: InputDataString;
  millisecondTimestamp: string;
}

/** This is what wallets sign when submitting a batch */
export function createMessageForBatcher(
  namespace: string,
  inputData: string,
  millisecondTimestamp: string
): string {
  return namespace + inputData + millisecondTimestamp;
}

/**
 * Hash for the user's message to the batcher
 * Note: no need for namespace, as namespace is already checked before the hash is relevant
 * Note: need user address.
 *       It wasn't needed for the message since that gets signed by the public key
 *       So it contains the address indirectly
 */
export function hashBatchSubunit(input: BatchedSubunit): string {
  return hashFxn(input.userAddress + input.gameInput + input.millisecondTimestamp);
}

const hashFxn = (s: string): string => sha3(s) || '0x0';

export function packInput(input: BatchedSubunit): string {
  return [
    input.addressType.toString(10),
    input.userAddress,
    input.userSignature,
    input.gameInput,
    input.millisecondTimestamp,
  ].join(INNER_BATCH_DIVIDER);
}

/**
 * Adds batches until maxSize is reached, or not batches are left
 * If a batch is empty, empty string is returned (not `B`)
 * The inputs that got selected (taking into account the size limit) are returned
 */
export function buildBatchData(
  maxSize: number,
  inputs: BatchedSubunit[]
): {
  selectedInputs: BatchedSubunit[];
  data: string;
} {
  const selectedInputs: BatchedSubunit[] = [];
  let batchedTransaction = BATCH_PREFIX;
  let remainingSpace = maxSize - 1;

  for (let input of inputs) {
    const packed = packInput(input);
    if (packed.length + 1 > remainingSpace) {
      break;
    }

    batchedTransaction += OUTER_BATCH_DIVIDER;
    batchedTransaction += packed;
    remainingSpace -= packed.length + 1;
    selectedInputs.push(input);
  }

  // don't want to return just the prefix if there is nothing in the batch
  if (batchedTransaction === BATCH_PREFIX) {
    return { selectedInputs, data: '' };
  }

  return { selectedInputs, data: batchedTransaction };
}

export function extractBatches(inputData: string): string[] {
  const hasClosingDivider = inputData[inputData.length - 1] === OUTER_BATCH_DIVIDER;
  const elems = inputData.split(OUTER_BATCH_DIVIDER);
  const afterLastIndex = elems.length - (hasClosingDivider ? 1 : 0);

  const prefix = elems[0];

  if (prefix !== BATCH_PREFIX) {
    return [];
  }

  return elems.slice(1, afterLastIndex);
}
