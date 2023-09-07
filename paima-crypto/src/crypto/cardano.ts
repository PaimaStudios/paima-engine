import verifyCardanoDataSignature from '@cardano-foundation/cardano-verify-datasignature';
import { doLog } from '@paima/utils';
import type { IVerify } from './IVerify';

export class CardanoCrypto implements IVerify {
  verifyAddress = async (address: string): Promise<boolean> => {
    // TODO: improve
    return await Promise.resolve(/^[0-9a-z_]+$/.test(address));
  };
  verifySignature = async (
    userAddress: string,
    message: string,
    sigStruct: string
  ): Promise<boolean> => {
    try {
      const [signature, key, ...remainder] = sigStruct.split('+');
      if (!signature || !key || remainder.length > 0) {
        return false;
      }
      return verifyCardanoDataSignature(signature, key, message, userAddress);
    } catch (err) {
      doLog('[address-validator] error verifying cardano signature:', err);
      return false;
    }
  };
}
