import type Web3 from 'web3';
import type { BlockTransactionString } from 'web3-eth';
import web3UtilsPkg from 'web3-utils';

import { doLog } from '@paima/utils';
import type { SubmittedChainData } from '@paima/utils';
import type { PaimaGameInteraction } from '@paima/utils/src/contract-types/Storage';

import type { ValidatedSubmittedChainData } from './utils.js';
import { OUTER_DIVIDER, INNER_DIVIDER, AddressType } from './constants.js';
import { createNonce, determineAddressType, unpackValidatedData } from './utils.js';
import verifySignatureEthereum from './verification-ethereum.js';
import verifySignatureCardano from './verification-cardano.js';
import verifySignaturePolkadot from './verification-polkadot.js';

const { hexToUtf8 } = web3UtilsPkg;

export async function extractSubmittedData(
  web3: Web3,
  block: BlockTransactionString,
  events: PaimaGameInteraction[]
): Promise<SubmittedChainData[]> {
  const eventMapper = (e: PaimaGameInteraction): Promise<SubmittedChainData[]> => {
    const data = e.returnValues.data;
    const decodedData = data && data.length > 0 ? hexToUtf8(data) : '';
    return processDataUnit(
      web3,
      {
        userAddress: e.returnValues.userAddress,
        inputData: decodedData,
        inputNonce: '',
        suppliedValue: e.returnValues.value,
      },
      block.number
    );
  };

  const unflattenedList = await Promise.all(events.map(eventMapper));
  return unflattenedList.flat();
}

export async function processDataUnit(
  web3: Web3,
  unit: SubmittedChainData,
  blockHeight: number
): Promise<SubmittedChainData[]> {
  try {
    if (!unit.inputData.includes(OUTER_DIVIDER)) {
      // Directly submitted input, prepare nonce and return:
      const hashInput = blockHeight.toString(10) + unit.userAddress + unit.inputData;
      const inputNonce = createNonce(web3, hashInput);
      return [
        {
          ...unit,
          inputNonce,
        },
      ];
    }

    const hasClosingTilde = unit.inputData[unit.inputData.length - 1] === OUTER_DIVIDER;
    const elems = unit.inputData.split(OUTER_DIVIDER);
    const afterLastIndex = elems.length - (hasClosingTilde ? 1 : 0);

    const prefix = elems[0];
    const subunitCount = elems.length - 1;
    const subunitValue = web3.utils
      .toBN(unit.suppliedValue)
      .div(web3.utils.toBN(subunitCount))
      .toString(10);

    if (prefix === 'B') {
      const validatedSubUnits = await Promise.all(
        elems.slice(1, afterLastIndex).map(elem => processBatchedSubunit(web3, elem, subunitValue))
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
  suppliedValue: string
): Promise<ValidatedSubmittedChainData> {
  const INVALID_INPUT: ValidatedSubmittedChainData = {
    inputData: '',
    userAddress: '',
    inputNonce: '',
    suppliedValue: '0',
    validated: false,
  };

  const elems = input.split(INNER_DIVIDER);
  if (elems.length !== 4) {
    return INVALID_INPUT;
  }

  const [userAddress, userSignature, inputData, millisecondTimestamp] = elems;
  const validated = await validateSubunit(
    web3,
    userAddress,
    userSignature,
    inputData,
    millisecondTimestamp
  );

  const hashInput = millisecondTimestamp + userAddress + inputData;
  const inputNonce = createNonce(web3, hashInput);

  return {
    inputData,
    userAddress,
    inputNonce,
    suppliedValue,
    validated,
  };
}

async function validateSubunit(
  web3: Web3,
  userAddress: string,
  userSignature: string,
  inputData: string,
  millisecondTimestamp: string
): Promise<boolean> {
  const addressType = determineAddressType(userAddress);
  const message: string = inputData + millisecondTimestamp;
  switch (addressType) {
    case AddressType.Ethereum:
      return verifySignatureEthereum(web3, message, userAddress, userSignature);
    case AddressType.Cardano:
      return await verifySignatureCardano(userAddress, message, userSignature);
    case AddressType.Polkadot:
      return verifySignaturePolkadot(userAddress, message, userSignature);
    default:
      return false;
  }
}
