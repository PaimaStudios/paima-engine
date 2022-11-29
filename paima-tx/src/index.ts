import { numberToHex } from 'web3-utils';

import { DEFAULT_GAS_PRICE, getStorageContract, validateStorageAddress } from '@paima/utils';
import type { StorageContract } from '@paima/utils';
import type { TransactionTemplate } from '@paima/utils';

export function getTxTemplate<T extends keyof StorageContract['methods']>(
  storageAddress: string,
  methodName: T,
  ...data: Parameters<StorageContract['methods'][T]>
): TransactionTemplate {
  validateStorageAddress(storageAddress);
  const storage = getStorageContract();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-assertion
  const txData = (storage.methods[methodName] as any)(...data).encodeABI();
  return {
    data: txData,
    to: storageAddress,
    gasPrice: numberToHex(DEFAULT_GAS_PRICE),
  };
}
