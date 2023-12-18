import type Web3 from 'web3';
import { AddressType, doLog, getReadNamespaces } from '@paima/utils';
import type { SubmittedData } from '@paima/runtime';
import type { PaimaGameInteraction } from '@paima/utils/src/contract-types/PaimaL2Contract.js';
import { CryptoManager } from '@paima/crypto';
import {
  INNER_BATCH_DIVIDER,
  OUTER_BATCH_DIVIDER,
  createMessageForBatcher,
  extractBatches,
} from '@paima/concise';
import { toBN, hexToUtf8, sha3 } from 'web3-utils';
import type { PoolClient } from 'pg';
import { getMainAddress } from '@paima/db';

interface ValidatedSubmittedData extends SubmittedData {
  validated: boolean;
}

const TIMESTAMP_LIMIT = 24 * 3600;

export async function extractSubmittedData(
  web3: Web3,
  events: PaimaGameInteraction[],
  blockTimestamp: number,
  DBConn: PoolClient
): Promise<SubmittedData[]> {
  const unflattenedList = await Promise.all(
    events.map(e => eventMapper(web3, e, blockTimestamp, DBConn))
  );
  return unflattenedList.flat();
}

async function eventMapper(
  web3: Web3,
  e: PaimaGameInteraction,
  blockTimestamp: number,
  DBConn: PoolClient
): Promise<SubmittedData[]> {
  const decodedData = decodeEventData(e.returnValues.data);
  const address = await getMainAddress(e.returnValues.userAddress, DBConn);
  return await processDataUnit(
    web3,
    {
      userId: address.id,
      realAddress: e.returnValues.userAddress,
      userAddress: address.address,
      inputData: decodedData,
      inputNonce: '', // placeholder that will be filled later
      suppliedValue: e.returnValues.value,
      scheduled: false,
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

async function processDataUnit(
  web3: Web3,
  unit: SubmittedData,
  blockHeight: number,
  blockTimestamp: number,
  DBConn: PoolClient
): Promise<SubmittedData[]> {
  try {
    if (!unit.inputData.includes(OUTER_BATCH_DIVIDER)) {
      // Directly submitted input, prepare nonce and return:
      const inputNonce = createUnbatchedNonce(blockHeight, unit.userAddress, unit.inputData);
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
        processBatchedSubunit(web3, elem, subunitValue, blockHeight, blockTimestamp, DBConn)
      )
    );
    return validatedSubUnits.filter(item => item.validated).map(unpackValidatedData);
  } catch (err) {
    doLog(`[funnel::processDataUnit] error: ${err}`);
    return [];
  }
}

async function processBatchedSubunit(
  web3: Web3,
  input: string,
  suppliedValue: string,
  blockHeight: number,
  blockTimestamp: number,
  DBConn: PoolClient
): Promise<ValidatedSubmittedData> {
  const INVALID_INPUT: ValidatedSubmittedData = {
    inputData: '',
    realAddress: '',
    userId: -1,
    userAddress: '',
    inputNonce: '',
    suppliedValue: '0',
    scheduled: false,
    validated: false,
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
    web3,
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

  const address = await getMainAddress(userAddress, DBConn);
  return {
    inputData,
    realAddress: userAddress,
    userAddress: address.address,
    userId: address.id,
    inputNonce,
    suppliedValue,
    scheduled: false,
    validated,
  };
}

function validateSubunitTimestamp(subunitTimestamp: number, blockTimestamp: number): boolean {
  return Math.abs(subunitTimestamp - blockTimestamp) < TIMESTAMP_LIMIT;
}

async function validateSubunitSignature(
  web3: Web3,
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
        return await CryptoManager.Evm(web3).verifySignature(userAddress, message, userSignature);
      case AddressType.CARDANO:
        return await CryptoManager.Cardano().verifySignature(userAddress, message, userSignature);
      case AddressType.POLKADOT:
        return await CryptoManager.Polkadot().verifySignature(userAddress, message, userSignature);
      case AddressType.ALGORAND:
        return await CryptoManager.Algorand().verifySignature(userAddress, message, userSignature);
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
  return hashFxn(millisecondTimestamp + userAddress + inputData);
}
export function createUnbatchedNonce(
  blockHeight: number,
  userAddress: string,
  inputData: string
): string {
  return hashFxn(blockHeight.toString(10) + userAddress + inputData);
}

const hashFxn = (s: string): string => sha3(s) || '0x0';
