import type Web3 from 'web3';
import web3UtilsPkg from 'web3-utils';

import {
  AddressType,
  doLog,
  getReadNamespaces,
  INNER_BATCH_DIVIDER,
  OUTER_BATCH_DIVIDER,
} from '@paima/utils';
import type { SubmittedData } from '@paima/runtime';
import type { PaimaGameInteraction } from '@paima/utils/src/contract-types/PaimaL2Contract';

import verifySignatureEthereum from './verification/ethereum.js';
import verifySignatureCardano from './verification/cardano.js';
import verifySignaturePolkadot from './verification/polkadot.js';
import verifySignatureAlgorand from './verification/algorand.js';

const { toBN, sha3, hexToUtf8 } = web3UtilsPkg;

interface ValidatedSubmittedData extends SubmittedData {
  validated: boolean;
}

const TIMESTAMP_LIMIT = 24 * 3600;

export async function extractSubmittedData(
  web3: Web3,
  events: PaimaGameInteraction[],
  blockTimestamp: number
): Promise<SubmittedData[]> {
  const unflattenedList = await Promise.all(events.map(e => eventMapper(web3, e, blockTimestamp)));
  return unflattenedList.flat();
}

async function eventMapper(
  web3: Web3,
  e: PaimaGameInteraction,
  blockTimestamp: number
): Promise<SubmittedData[]> {
  const decodedData = decodeEventData(e.returnValues.data);
  return await processDataUnit(
    web3,
    {
      userAddress: e.returnValues.userAddress,
      inputData: decodedData,
      inputNonce: '',
      suppliedValue: e.returnValues.value,
      scheduled: false,
    },
    e.blockNumber,
    blockTimestamp
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
  blockTimestamp: number
): Promise<SubmittedData[]> {
  try {
    if (!unit.inputData.includes(OUTER_BATCH_DIVIDER)) {
      // Directly submitted input, prepare nonce and return:
      const hashInput = blockHeight.toString(10) + unit.userAddress + unit.inputData;
      const inputNonce = createNonce(hashInput);
      return [
        {
          ...unit,
          inputNonce,
        },
      ];
    }

    const hasClosingDivider = unit.inputData[unit.inputData.length - 1] === OUTER_BATCH_DIVIDER;
    const elems = unit.inputData.split(OUTER_BATCH_DIVIDER);
    const afterLastIndex = elems.length - (hasClosingDivider ? 1 : 0);

    const prefix = elems[0];
    const subunitCount = elems.length - 1;
    const subunitValue = toBN(unit.suppliedValue).div(toBN(subunitCount)).toString(10);

    if (prefix === 'B') {
      const validatedSubUnits = await Promise.all(
        elems
          .slice(1, afterLastIndex)
          .map(elem => processBatchedSubunit(web3, elem, subunitValue, blockHeight, blockTimestamp))
      );
      return validatedSubUnits.filter(item => item.validated).map(unpackValidatedData);
    } else {
      // Encountered unknown type of ~-separated input
      return [];
    }
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
  blockTimestamp: number
): Promise<ValidatedSubmittedData> {
  const INVALID_INPUT: ValidatedSubmittedData = {
    inputData: '',
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
  const timestampValidated = validateSubunitTimestamp(secondTimestamp, blockTimestamp); // TODO

  const validated = signatureValidated && timestampValidated;

  const hashInput = millisecondTimestamp + userAddress + inputData;
  const inputNonce = createNonce(hashInput);

  return {
    inputData,
    userAddress,
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

  const trySign = async (message: string): Promise<boolean> => {
    switch (addressType) {
      case AddressType.EVM:
        return verifySignatureEthereum(web3, message, userAddress, userSignature);
      case AddressType.CARDANO:
        return await verifySignatureCardano(userAddress, message, userSignature);
      case AddressType.POLKADOT:
        return await verifySignaturePolkadot(userAddress, message, userSignature);
      case AddressType.ALGORAND:
        return await verifySignatureAlgorand(userAddress, message, userSignature);
      default:
        return false;
    }
  };
  for (const namespace of namespaces) {
    const message: string = namespace + inputData + millisecondTimestamp;
    if (await trySign(message)) {
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

function createNonce(nonceInput: string): string {
  let nonce = sha3(nonceInput);
  if (!nonce) {
    doLog(`[funnel] WARNING: failure generating nonce from: ${nonceInput}`);
    nonce = '';
  }
  return nonce;
}
