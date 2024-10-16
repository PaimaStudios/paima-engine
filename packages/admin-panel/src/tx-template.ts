import web3 from 'web3-utils';
const { numberToHex } = web3;

import {
  DEFAULT_GAS_PRICE,
  getPaimaL2Contract,
  validatePaimaL2ContractAddress,
} from '@paima/utils';
import type { PaimaL2Contract } from '@paima/utils';
import type { TransactionTemplate } from '@paima/utils';

export function getTxTemplate<T extends keyof PaimaL2Contract['methods']>(
  storageAddress: string,
  methodName: T,
  ...data: Parameters<PaimaL2Contract['methods'][T]>
): TransactionTemplate {
  validatePaimaL2ContractAddress(storageAddress);
  const storage = getPaimaL2Contract(storageAddress);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-assertion
  const txData = (storage.methods[methodName] as any)(...data).encodeABI();
  return {
    data: txData,
    to: storageAddress,
    gasPrice: numberToHex(DEFAULT_GAS_PRICE),
  };
}
