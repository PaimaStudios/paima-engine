import web3UtilsPkg from 'web3-utils';
import { web3Accounts, web3Enable, web3FromSource } from '@polkadot/extension-dapp';

import {
  buildEndpointErrorFxn,
  PaimaMiddlewareErrorCode,
  FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED,
} from '../errors';
import {
  getGameName,
  getPolkadotAddress,
  getPolkadotSignFxn,
  polkadotConnected,
  setPolkadotAddress,
  setPolkadotSignFxn,
} from '../state';
import { Result, Wallet } from '../types';

const { utf8ToHex } = web3UtilsPkg;

export async function polkadotLoginRaw(): Promise<Result<true>> {
  const errorFxn = buildEndpointErrorFxn('polkadotLoginRaw');

  const extensions = await web3Enable(getGameName());
  if (extensions.length === 0) {
    return errorFxn(
      PaimaMiddlewareErrorCode.POLKADOT_WALLET_NOT_INSTALLED,
      undefined,
      FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED
    );
  }
  const allAccounts = await web3Accounts();
  if (allAccounts.length === 0) {
    throw new Error('[polkadot] No accounts detected!');
  }
  const account = allAccounts[0];
  const injector = await web3FromSource(account.meta.source);
  const signRaw = injector?.signer?.signRaw;
  if (!signRaw) {
    throw new Error('[polkadot] Unable to get signRaw!');
  }
  setPolkadotAddress(account.address);
  setPolkadotSignFxn(signRaw);

  return {
    success: true,
    result: true,
  };
}

export async function signMessagePolkadot(userAddress: string, message: string) {
  if (!polkadotConnected()) {
    throw new Error('[polkadot] Not connected!');
  }
  const hexMessage = utf8ToHex(message);
  console.log(`About to sign ${hexMessage} with ${userAddress}`);
  const signRaw = getPolkadotSignFxn();
  const { signature } = await signRaw({
    address: userAddress,
    data: hexMessage,
    type: 'bytes',
  });
  return signature;
}

export async function polkadotLoginWrapper(): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('polkadotLoginWrapper');

  try {
    const result = await polkadotLoginRaw();
    if (!result.success) {
      return result;
    }
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.POLKADOT_LOGIN, err);
  }

  return {
    success: true,
    result: {
      walletAddress: getPolkadotAddress(),
    },
  };
}
