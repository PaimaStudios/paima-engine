import type Web3 from 'web3';

import { doLog } from '@paima/utils';

export default function (
  web3: Web3,
  message: string,
  userAddress: string,
  userSignature: string
): boolean {
  try {
    const recoveredAddr = web3.eth.accounts.recover(message, userSignature);
    return recoveredAddr.toLowerCase() === userAddress.toLowerCase();
  } catch (err) {
    doLog(`[funnel] error verifying ethereum signature: ${err}`);
    return false;
  }
}
