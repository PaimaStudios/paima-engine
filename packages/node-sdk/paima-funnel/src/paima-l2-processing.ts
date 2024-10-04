import { AddressType, doLog, getReadNamespaces } from '@paima/utils';
import type { SubmittedData } from '@paima/runtime';
import type { PaimaGameInteraction } from '@paima/utils';
import type { NonTimerSubmittedData } from '@paima/chain-types';
import { CryptoManager } from '@paima/crypto';
import {
  BuiltinGrammarPrefix,
  createMessageForBatcher,
  extractBatches,
  type ExtractedBatchSubunit,
  usesPrefix,
} from '@paima/concise';
import { hexToString } from 'viem';
import { keccak_256 } from 'js-sha3';

interface ValidatedSubmittedData extends SubmittedData {
  validated: boolean;
}

const TIMESTAMP_LIMIT = 24 * 3600;

export async function extractSubmittedData(
  events: PaimaGameInteraction[],
  blockTimestamp: number,
  caip2: string
): Promise<SubmittedData[]> {
  const unflattenedList = await Promise.all(
    events.map(e => eventMapper(e, blockTimestamp, caip2, e.address))
  );
  return unflattenedList.flat();
}

async function eventMapper(
  e: PaimaGameInteraction,
  blockTimestamp: number,
  caip2: string,
  contractAddress: string
): Promise<SubmittedData[]> {
  const decodedData = decodeEventData(e.returnValues.data as `0x${string}`);
  return await processDataUnit(
    {
      realAddress: e.returnValues.userAddress,
      inputData: decodedData,
      inputNonce: '', // placeholder that will be filled later
      suppliedValue: e.returnValues.value,
      scheduled: false,
      origin: {
        txHash: e.transactionHash,
        caip2,
        contractAddress,
        primitiveName: null, // TODO
        scheduledAtMs: null,
      },
    },
    e.blockNumber,
    blockTimestamp
  );
}

function decodeEventData(eventData: `0x${string}`): string {
  if (eventData.length > 0) {
    try {
      const decodedData = hexToString(eventData);
      return decodedData;
    } catch (err) {
      return '';
    }
  } else {
    return '';
  }
}

export async function processDataUnit(
  unit: NonTimerSubmittedData,
  blockHeight: number,
  blockTimestamp: number
): Promise<SubmittedData[]> {
  try {
    if (!usesPrefix(unit.inputData, BuiltinGrammarPrefix.batcherInput)) {
      // Directly submitted input, prepare nonce and return:
      const inputNonce = createUnbatchedNonce(blockHeight, unit.realAddress, unit.inputData);
      return [
        {
          ...unit,
          inputNonce,
        },
      ];
    }

    const subunits = extractBatches(unit.inputData);
    if (subunits.length === 0) return [];

    const subunitValue = (BigInt(unit.suppliedValue) / BigInt(subunits.length)).toString(10);
    const validatedSubUnits = await Promise.all(
      subunits.map(elem =>
        processBatchedSubunit(elem, subunitValue, blockHeight, blockTimestamp, unit.origin)
      )
    );
    return validatedSubUnits.filter(item => item.validated).map(unpackValidatedData);
  } catch (err) {
    doLog(`[funnel::processDataUnit] error: ${err}`);
    return [];
  }
}

async function processBatchedSubunit(
  input: ExtractedBatchSubunit,
  suppliedValue: string,
  blockHeight: number,
  blockTimestamp: number,
  origin: NonTimerSubmittedData['origin']
): Promise<ValidatedSubmittedData> {
  const signatureValidated = await validateSubunitSignature(
    input.parsed.addressType,
    input.parsed.userAddress,
    input.parsed.userSignature,
    input.raw,
    input.parsed.millisecondTimestamp,
    blockHeight
  );

  const secondTimestamp = parseInt(input.parsed.millisecondTimestamp, 10) / 1000;
  const timestampValidated = validateSubunitTimestamp(secondTimestamp, blockTimestamp);

  const validated = signatureValidated && timestampValidated;

  const inputNonce = createBatchNonce(
    input.parsed.millisecondTimestamp,
    input.parsed.userAddress,
    input.raw
  );

  return {
    inputData: input.raw,
    realAddress: input.parsed.userAddress,
    inputNonce,
    suppliedValue,
    scheduled: false,
    validated,
    origin,
  };
}

function validateSubunitTimestamp(subunitTimestamp: number, blockTimestamp: number): boolean {
  return Math.abs(subunitTimestamp - blockTimestamp) < TIMESTAMP_LIMIT;
}

async function validateSubunitSignature(
  addressType: AddressType,
  userAddress: string,
  userSignature: string,
  inputData: string,
  millisecondTimestamp: string,
  blockHeight: number
): Promise<boolean> {
  const namespaces = await getReadNamespaces(blockHeight);

  const tryVerifySig = async (message: string): Promise<boolean> => {
    switch (addressType) {
      case AddressType.EVM:
        return await CryptoManager.Evm().verifySignature(userAddress, message, userSignature);
      case AddressType.CARDANO:
        return await CryptoManager.Cardano().verifySignature(userAddress, message, userSignature);
      case AddressType.POLKADOT:
        return await CryptoManager.Polkadot().verifySignature(userAddress, message, userSignature);
      case AddressType.ALGORAND:
        return await CryptoManager.Algorand().verifySignature(userAddress, message, userSignature);
      case AddressType.MINA:
        return await CryptoManager.Mina().verifySignature(userAddress, message, userSignature);
      default:
        return false;
    }
  };
  for (const namespace of namespaces) {
    const message: string = createMessageForBatcher(namespace, inputData, millisecondTimestamp);
    if (await tryVerifySig(message)) {
      return true;
    }
  }
  return false;
}

function unpackValidatedData(validatedData: ValidatedSubmittedData): SubmittedData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = validatedData as any;
  delete o.validated;
  return o as SubmittedData;
}

export function createBatchNonce(
  millisecondTimestamp: string,
  userAddress: string,
  inputData: string
): string {
  return '0x' + keccak_256(millisecondTimestamp + userAddress + inputData);
}
export function createUnbatchedNonce(
  blockHeight: number,
  userAddress: string,
  inputData: string
): string {
  return '0x' + keccak_256(blockHeight.toString(10) + userAddress + inputData);
}
