import web3UtilsPkg from 'web3-utils';

import {
  DEFAULT_GAS_PRICE,
  ENV,
  getPaimaL2Contract,
  validatePaimaL2ContractAddress,
} from '@paima/utils';
import type { PaimaL2Contract } from '@paima/utils';
import type { TransactionTemplate } from '@paima/utils';
import { getFee, getStorageAddress } from '../state';

const { numberToHex, utf8ToHex } = web3UtilsPkg;

function getTxTemplate<T extends keyof PaimaL2Contract['methods']>(
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

export function buildDirectTx(
  userAddress: string,
  methodName: 'paimaSubmitGameInput',
  dataUtf8: string
): Record<string, any> {
  const hexData = utf8ToHex(dataUtf8);
  const txTemplate = getTxTemplate(getStorageAddress(), methodName, hexData);

  const tx = {
    ...txTemplate,
    from: userAddress,
    value: numberToHex(getFee()?.fee ?? ENV.DEFAULT_FEE),
  };

  return tx;
}
