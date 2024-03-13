import { doLog } from '@paima/utils';
import type { IVerify } from './IVerify.js';

export class EvmCrypto implements IVerify {
  verifyAddress = async (address: string): Promise<boolean> => {
    // TODO: improve
    return await Promise.resolve(/^0x[0-9A-Fa-f]+$/.test(address));
  };
  verifySignature = async (
    userAddress: string,
    message: string,
    signature: string
  ): Promise<boolean> => {
    try {
      const recoveredAddr = (await import('ethers')).verifyMessage(message, signature);
      return await Promise.resolve(recoveredAddr.toLowerCase() === userAddress.toLowerCase());
    } catch (err) {
      doLog('[address-validator] error verifying evm signature:', err);
      return await Promise.resolve(false);
    }
  };
}
