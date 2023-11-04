import web3UtilsPkg from 'web3-utils';

import {
  DEFAULT_GAS_PRICE,
  ENV,
  getPaimaL2Contract,
  validatePaimaL2ContractAddress,
} from '@paima/utils';
import type { PaimaL2Contract } from '@paima/utils';
import type { TransactionTemplate } from '@paima/utils';
import { getFee, getStorageAddress } from '../state.js';

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

/** Common parameters between the different EVM providers */
type CommonTransactionRequest = {
  to?: string;
  from: string;
  nonce?: string;

  gasPrice?: string;

  data: string;
  value?: string;

  maxPriorityFeePerGas?: string;
  maxFeePerGas?: string;
};

export type PostFxn = (tx: CommonTransactionRequest) => Promise<string>;

export function buildDirectTx(
  userAddress: string,
  methodName: 'paimaSubmitGameInput',
  dataUtf8: string
): CommonTransactionRequest {
  const hexData = utf8ToHex(dataUtf8);
  const txTemplate = getTxTemplate(getStorageAddress(), methodName, hexData);

  const tx = {
    ...txTemplate,
    from: userAddress,
    value: numberToHex(getFee()?.fee ?? ENV.DEFAULT_FEE),
  };

  return tx;
}
