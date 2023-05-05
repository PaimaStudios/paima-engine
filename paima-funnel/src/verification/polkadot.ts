import { cryptoWaitReady, decodeAddress, signatureVerify } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

import { doLog } from '@paima/utils';

export default async function (
  userAddress: string,
  message: string,
  signedMessage: string
): Promise<boolean> {
  try {
    await cryptoWaitReady();
    const publicKey = decodeAddress(userAddress);
    const hexPublicKey = u8aToHex(publicKey);
    return signatureVerify(message, signedMessage, hexPublicKey).isValid;
  } catch (err) {
    doLog(`[funnel] error verifying polkadot signature: ${err}`);
    return false;
  }
}
