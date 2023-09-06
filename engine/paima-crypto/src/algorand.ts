import type { SignedTransaction, Transaction, SuggestedParams } from 'algosdk';
import algosdk from 'algosdk';
import nacl from 'tweetnacl';
import { doLog, hexStringToUint8Array } from '@paima/utils';
import web3UtilsPkg from 'web3-utils';
import type { IVerify } from './IVerify';

export class AlgorandCrypto implements IVerify {
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
      const sig = Buffer.from(hexStringToUint8Array(signature));
      const txn = this.buildAlgorandTransaction(userAddress, message);
      const signedTx: SignedTransaction = {
        txn,
        sig,
      };
      return await Promise.resolve(this.verifySignedTransaction(signedTx));
    } catch (err) {
      doLog(`[funnel] error verifying algorand signature: ${err}`);
      return await Promise.resolve(false);
    }
  };

  buildAlgorandTransaction = (userAddress: string, message: string): Transaction => {
    const hexMessage = web3UtilsPkg.utf8ToHex(message).slice(2);
    const msgArray = hexStringToUint8Array(hexMessage);
    const SUGGESTED_PARAMS: SuggestedParams = {
      fee: 0,
      firstRound: 10,
      lastRound: 10,
      genesisID: 'mainnet-v1.0',
      genesisHash: 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=',
    };
    return algosdk.makePaymentTxnWithSuggestedParams(
      userAddress,
      userAddress,
      0,
      undefined,
      msgArray,
      SUGGESTED_PARAMS
    );
  };

  verifySignedTransaction = (signedTransaction: SignedTransaction): boolean => {
    if (signedTransaction.sig === undefined) return false;

    const pkBytes = signedTransaction.txn.from.publicKey;

    const signatureBytes = new Uint8Array(signedTransaction.sig);

    const transactionBytes = algosdk.encodeObj(signedTransaction.txn.get_obj_for_encoding());
    const messageBytes = new Uint8Array(transactionBytes.length + 2);
    messageBytes.set(Buffer.from('TX'));
    messageBytes.set(transactionBytes, 2);

    return nacl.sign.detached.verify(messageBytes, signatureBytes, pkBytes);
  };

  decodeSignedTransaction = (signedTx: Uint8Array): SignedTransaction => {
    return algosdk.decodeSignedTransaction(signedTx);
  };
}
