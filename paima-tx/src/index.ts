import { numberToHex } from 'web3-utils';

import { DEFAULT_GAS_PRICE, getStorageContract, validateStorageAddress } from '@paima/utils';
import type { TransactionTemplate } from '@paima/utils';

export function getTxTemplate(
  storageAddress: string,
  methodName: string,
  data?: string
): TransactionTemplate {
  validateStorageAddress(storageAddress);
  const storage = getStorageContract();
  let txData;
  if (typeof data === 'undefined') {
    txData = storage.methods[methodName]().encodeABI();
  } else {
    txData = storage.methods[methodName](data).encodeABI();
  }
  return {
    data: txData,
    to: storageAddress,
    gasPrice: numberToHex(DEFAULT_GAS_PRICE),
  };
}
