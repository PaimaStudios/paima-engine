import { doLog } from '@paima/utils';
import type { IVerify } from './IVerify.js';
const base58check = require('base58check');

export class MinaCrypto implements IVerify {
  verifyAddress = async (address: string): Promise<boolean> => {
    try {
      base58check.decode(address);
    } catch (e) {
      return false;
    }

    return true;
  };
  verifySignature = async (
    userAddress: string,
    message: string,
    sigStruct: string
  ): Promise<boolean> => {
    try {
      const [field, scalar, network, ...remainder] = sigStruct.split(';');
      if (!field || !scalar || !network || remainder.length > 0) {
        return false;
      }

      const Client = require('mina-signer');

      const signerClient = new Client({ network });

      const verifyBody = {
        data: message,
        publicKey: userAddress,
        signature: { field, scalar },
      };

      const verifyResult = signerClient.verifyMessage(verifyBody);

      return verifyResult;
    } catch (err) {
      doLog('[address-validator] error verifying mina signature:', err);
      return false;
    }
  };
}
