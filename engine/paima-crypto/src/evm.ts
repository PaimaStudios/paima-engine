import type Web3 from 'web3';
import { doLog } from '@paima/utils';
import type { IVerify } from './IVerify';

export class EvmCrypto implements IVerify {
  constructor(public readonly web3: Web3) {}

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
      const recoveredAddr = this.web3.eth.accounts.recover(message, signature);
      return await Promise.resolve(recoveredAddr.toLowerCase() === userAddress.toLowerCase());
    } catch (err) {
      doLog('[address-validator] error verifying cardano signature:', err);
      return await Promise.resolve(false);
    }
  };
}
