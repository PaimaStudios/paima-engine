import * as Cardano from '@dcspark/cardano-multiplatform-lib-nodejs';
import verifyCardanoDataSignature from '@cardano-foundation/cardano-verify-datasignature';

import { doLog } from '@paima/utils';

export default async function (
  userAddress: string,
  message: string,
  signedMessage: string
): Promise<boolean> {
  try {
    const [signature, key, ...remainder] = signedMessage.split('+');
    if (!signature || !key || remainder.length > 0) {
      return false;
    }
    return verifyCardanoDataSignature(signature, key, message, userAddress);
  } catch (err) {
    doLog(`[funnel] error verifying cardano signature: ${err}`);
    return false;
  }
}
