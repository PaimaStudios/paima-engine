import { doLog } from '@paima/utils';
import type { IVerify } from './IVerify.js';

export class MinaCrypto implements IVerify {
  verifyAddress = async (address: string): Promise<boolean> => {
    // base58 alphabet
    return await Promise.resolve(
      /^[1|2|3|4|5|6|7|8|9|A|B|C|D|E|F|G|H|J|K|L|M|N|P|Q|R|S|T|U|V|W|X|Y|Z|a|b|c|d|e|f|g|h|i|j|k|m|n|o|p|q|r|s|t|u|v|w|x|y|z]/.test(
        address
      )
    );
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
