import { decodeAddress, signatureVerify } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import { doLog } from '@paima/utils';
import type { IVerify } from './IVerify';

export class PolkadotCrypto implements IVerify {
  verifyAddress = async (address: string): Promise<boolean> => {
    // TODO: improve
    return await Promise.resolve(/^[0-9a-zA-Z]+$/.test(address));
  };
  verifySignature = async (
    userAddress: string,
    message: string,
    signature: string
  ): Promise<boolean> => {
    try {
      const publicKey = decodeAddress(userAddress);
      const hexPublicKey = u8aToHex(publicKey);
      return signatureVerify(message, signature, hexPublicKey).isValid;
    } catch (err) {
      doLog('[address-validator] error verifying polkadot signature:', err);
      return false;
    }
  };
}
