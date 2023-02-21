import type Web3 from 'web3';

import type { SubmittedChainData } from '@paima/utils';
import { AddressType, doLog } from '@paima/utils';

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

// Timeout function for promises
export const timeout = <T>(prom: Promise<T>, time: number): Promise<Awaited<T>> =>
  Promise.race([prom, new Promise<T>((_resolve, reject) => setTimeout(reject, time))]);
