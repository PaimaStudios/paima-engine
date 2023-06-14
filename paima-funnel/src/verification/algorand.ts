import type { SignedTransaction } from 'algosdk';
import algosdk from 'algosdk';
import nacl from 'tweetnacl';

import { buildAlgorandTransaction, doLog, hexStringToUint8Array } from '@paima/utils';

export default async function (
  userAddress: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    const sig = Buffer.from(hexStringToUint8Array(signature));
    const txn = buildAlgorandTransaction(userAddress, message);
    const signedTx: SignedTransaction = {
      txn,
      sig,
    };
    return verifySignedTransaction(signedTx);
  } catch (err) {
    doLog(`[funnel] error verifying algorand signature: ${err}`);
    return false;
  }
}

function verifySignedTransaction(signedTransaction: SignedTransaction): boolean {
  if (signedTransaction.sig === undefined) return false;

  const pkBytes = signedTransaction.txn.from.publicKey;

  const signatureBytes = new Uint8Array(signedTransaction.sig);

  const transactionBytes = algosdk.encodeObj(signedTransaction.txn.get_obj_for_encoding());
  const messageBytes = new Uint8Array(transactionBytes.length + 2);
  messageBytes.set(Buffer.from('TX'));
  messageBytes.set(transactionBytes, 2);

  return nacl.sign.detached.verify(messageBytes, signatureBytes, pkBytes);
}
