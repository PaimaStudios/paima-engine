import type Web3 from 'web3';
import { sha3 } from 'web3-utils';

import type { SubmittedData } from '@paima/utils';
import { doLog } from '@paima/utils';

export interface ValidatedSubmittedData extends SubmittedData {
  validated: boolean;
}

export function unpackValidatedData(validatedData: ValidatedSubmittedData): SubmittedData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = validatedData as any;
  delete o.validated;
  return o as SubmittedData;
}

export function createNonce(nonceInput: string): string {
  let nonce = sha3(nonceInput);
  // TODO: ok if empty string?
  if (!nonce) {
    doLog(`[funnel] WARNING: failure generating nonce from: ${nonceInput}`);
    nonce = '';
  }
  return nonce;
}
