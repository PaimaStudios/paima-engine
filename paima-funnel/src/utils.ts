import type Web3 from 'web3';

import type { SubmittedChainData } from '@paima/utils';
import { doLog } from '@paima/utils';
import { AddressType } from './constants';

export interface ValidatedSubmittedChainData extends SubmittedChainData {
  validated: boolean;
}

export function unpackValidatedData(
  validatedData: ValidatedSubmittedChainData
): SubmittedChainData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = validatedData as any;
  delete o.validated;
  return o as SubmittedChainData;
}

export function createNonce(web3: Web3, nonceInput: string): string {
  let nonce = web3.utils.sha3(nonceInput);
  if (!nonce) {
    doLog(`[funnel] WARNING: failure generating nonce from: ${nonceInput}`);
    nonce = '';
  }
  return nonce;
}

export function determineAddressType(address: string): AddressType {
  if (address.slice(0, 2) === '0x') {
    return AddressType.Ethereum;
  } else if (address.slice(0, 4) === 'addr') {
    return AddressType.Cardano;
  } else {
    return AddressType.Polkadot;
  }
}

// Timeout function for promises
export const timeout = <T>(prom: Promise<T>, time: number): Promise<Awaited<T>> =>
  Promise.race([prom, new Promise<T>((_resolve, reject) => setTimeout(reject, time))]);
