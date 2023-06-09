import { PeraWalletConnect } from '@perawallet/connect';
import algosdk from 'algosdk';

import type { UserSignature } from '@paima/utils';
import { buildAlgorandTransaction, uint8ArrayToHexString } from '@paima/utils';

import { getAlgorandAddress, getAlgorandApi, setAlgorandAddress, setAlgorandApi } from '../state';
import type { Result, Wallet } from '../types';
import { PaimaMiddlewareErrorCode, buildEndpointErrorFxn } from '../errors';

async function peraLogin(): Promise<void> {
  const peraWallet = new PeraWalletConnect();
  const newAccounts = await peraWallet.connect();
  if (newAccounts.length < 1) {
    throw new Error('[peraLogin] no addresses returned!');
  }
  const address = newAccounts[0];
  setAlgorandAddress(address);
  setAlgorandApi(peraWallet);
}

export async function algorandLoginWrapper(): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('algorandLoginWrapper');

  try {
    await peraLogin();
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.ALGORAND_LOGIN, err);
  }

  return {
    success: true,
    result: {
      walletAddress: getAlgorandAddress(),
    },
  };
}

export async function signMessageAlgorand(
  userAddress: string,
  message: string
): Promise<UserSignature> {
  const peraWallet = getAlgorandApi();
  if (!peraWallet) {
    throw new Error('');
  }

  const txn = buildAlgorandTransaction(userAddress, message);
  const signerTx = {
    txn,
    signers: [userAddress],
  };

  const signedTxs = await peraWallet.signTransaction([[signerTx]], userAddress);
  if (signedTxs.length !== 1) {
    throw new Error(
      `[signMessageAlgorand] invalid number of signatures returned: ${signedTxs.length}`
    );
  }
  const signedTx = algosdk.decodeSignedTransaction(signedTxs[0]);
  const signature = signedTx.sig;
  if (!signature) {
    throw new Error(`[signMessageAlgorand] signature missing in signed Tx`);
  }
  const hexSignature = uint8ArrayToHexString(signature);
  return hexSignature;
}
