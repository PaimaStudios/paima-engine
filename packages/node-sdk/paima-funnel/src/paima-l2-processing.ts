import { AddressType, doLog, getReadNamespaces } from '@paima/utils';
import type { SubmittedData } from '@paima/runtime';
import type { PaimaGameInteraction } from '@paima/utils';
import type { NonTimerSubmittedData } from '@paima/chain-types';
import { CryptoManager } from '@paima/crypto';
import {
  INNER_BATCH_DIVIDER,
  OUTER_BATCH_DIVIDER,
  createMessageForBatcher,
  extractBatches,
} from '@paima/concise';
import { toBN, hexToUtf8 } from 'web3-utils';
import type { PoolClient } from 'pg';
import { keccak_256 } from 'js-sha3';

interface ValidatedSubmittedData extends SubmittedData {
  validated: boolean;
}

const TIMESTAMP_LIMIT = 24 * 3600;

export async function extractSubmittedData(
  events: PaimaGameInteraction[],
  blockTimestamp: number,
  DBConn: PoolClient,
  caip2: string
): Promise<SubmittedData[]> {
  const unflattenedList = await Promise.all(
    events.map(e => eventMapper(e, blockTimestamp, DBConn, caip2, e.address))
  );
  return unflattenedList.flat();
}

async function eventMapper(
  e: PaimaGameInteraction,
  blockTimestamp: number,
  DBConn: PoolClient,
  caip2: string,
  contractAddress: string
): Promise<SubmittedData[]> {
  const decodedData = decodeEventData(e.returnValues.data);
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
    blockTimestamp,
    DBConn
  );
}

function decodeEventData(eventData: string): string {
  if (eventData.length > 0) {
    try {
      const decodedData = hexToUtf8(eventData);
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
  blockTimestamp: number,
  DBConn: PoolClient
): Promise<SubmittedData[]> {
  try {
    if (!unit.inputData.includes(OUTER_BATCH_DIVIDER)) {
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

    const subunitValue = toBN(unit.suppliedValue).div(toBN(subunits.length)).toString(10);
    const validatedSubUnits = await Promise.all(
      subunits.map(elem =>
        processBatchedSubunit(elem, subunitValue, blockHeight, blockTimestamp, DBConn, unit.origin)
      )
    );
    return validatedSubUnits.filter(item => item.validated).map(unpackValidatedData);
  } catch (err) {
    doLog(`[funnel::processDataUnit] error: ${err}`);
    return [];
  }
}

async function processBatchedSubunit(
  input: string,
  suppliedValue: string,
  blockHeight: number,
  blockTimestamp: number,
  DBConn: PoolClient,
  origin: NonTimerSubmittedData['origin']
): Promise<ValidatedSubmittedData> {
  const INVALID_INPUT: ValidatedSubmittedData = {
    inputData: '',
    realAddress: '',
    inputNonce: '',
    suppliedValue: '0',
    scheduled: false,
    validated: false,
    origin,
  };

  const elems = input.split(INNER_BATCH_DIVIDER);
  if (elems.length !== 5) {
    return INVALID_INPUT;
  }

  const [addressTypeStr, userAddress, userSignature, inputData, millisecondTimestamp] = elems;
  if (!/^[0-9]+$/.test(addressTypeStr)) {
    return INVALID_INPUT;
  }
  const addressType = parseInt(addressTypeStr, 10);
  const signatureValidated = await validateSubunitSignature(
    addressType,
    userAddress,
    userSignature,
    inputData,
    millisecondTimestamp,
    blockHeight
  );

  const secondTimestamp = parseInt(millisecondTimestamp, 10) / 1000;
  const timestampValidated = validateSubunitTimestamp(secondTimestamp, blockTimestamp);

  const validated = signatureValidated && timestampValidated;

  const inputNonce = createBatchNonce(millisecondTimestamp, userAddress, inputData);

  return {
    inputData,
    realAddress: userAddress,
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
