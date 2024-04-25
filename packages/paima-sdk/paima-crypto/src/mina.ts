import { doLog } from '@paima/utils';
import type { IVerify } from './IVerify.js';

export class MinaCrypto implements IVerify {
  verifyAddress = async (address: string): Promise<boolean> => {
    // TODO: improve
    return await Promise.resolve(/^[a-zA-Z0-9]+$/.test(address));
  };
  verifySignature = async (
    userAddress: string,
    message: string,
    sigStruct: string
  ): Promise<boolean> => {
    try {
      const [field, scalar, ...remainder] = sigStruct.split(';');
      if (!field || !scalar || remainder.length > 0) {
        return false;
      }

      const Client = require('mina-signer');

      // type Network = 'mainnet' | 'testnet'
      // TODO: unhardcode, but not sure yet where to get this
      const signerClient = new Client({ network: 'testnet' });

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
