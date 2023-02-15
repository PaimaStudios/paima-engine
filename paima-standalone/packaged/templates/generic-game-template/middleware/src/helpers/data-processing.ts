import pkg from 'web3-utils';
import { getTxTemplate } from 'paima-sdk/paima-tx';
import { getFee, getStorageAddress } from '../state';
const { numberToHex, utf8ToHex } = pkg;

export function buildDirectTx(userAddress: string, dataUtf8: string): Record<string, any> {
  const hexData = utf8ToHex(dataUtf8);
  const txTemplate = getTxTemplate(getStorageAddress(), 'paimaSubmitGameInput', hexData);
  const tx = {
    ...txTemplate,
    from: userAddress,
    value: numberToHex(getFee()),
  };

  return tx;
}
