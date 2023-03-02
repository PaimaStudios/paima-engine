import pkg from 'web3-utils';
const { utf8ToHex } = pkg;

import {
  buildEndpointErrorFxn,
  PaimaMiddlewareErrorCode,
  FE_ERR_METAMASK_NOT_INSTALLED,
} from '../errors';
import {
  getActiveAddress,
  getChainCurrencyDecimals,
  getChainCurrencyName,
  getChainCurrencySymbol,
  getChainExplorerUri,
  getChainId,
  getChainName,
  getChainUri,
  getEthAddress,
  setEthAddress,
} from '../state';
import { OldResult, Result, Wallet } from '../types';
import { pushLog } from '../helpers/logging';
import { updateFee } from '../helpers/posting';

interface MetamaskSwitchError {
  code: number;
}

export async function rawWalletLogin(): Promise<string> {
  const accounts = (await window.ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[];
  if (!accounts || accounts.length === 0) {
    throw new Error('Unknown error while receiving accounts');
  }
  setEthAddress(accounts[0]);
  return accounts[0];
}

export async function sendWalletTransaction(tx: Record<string, any>): Promise<string> {
  const hash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [tx],
  });
  if (typeof hash !== 'string') {
    pushLog('[sendWalletTransaction] invalid signature:', hash);
    throw new Error(`[sendWalletTransaction] Received "hash" of type ${typeof hash}`);
  }
  return hash;
}

export async function switchChain(): Promise<boolean> {
  const errorFxn = buildEndpointErrorFxn('switchChain');

  const CHAIN_NOT_ADDED_ERROR_CODE = 4902;
  const hexChainId = '0x' + getChainId().toString(16);

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    });
    return await verifyWalletChain();
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    const se = switchError as MetamaskSwitchError;
    if (se.hasOwnProperty('code') && se.code === CHAIN_NOT_ADDED_ERROR_CODE) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: hexChainId,
              chainName: getChainName(),
              nativeCurrency: {
                name: getChainCurrencyName(),
                symbol: getChainCurrencySymbol(),
                decimals: getChainCurrencyDecimals(),
              },
              rpcUrls: [getChainUri()],
              blockExplorerUrls: [getChainExplorerUri()],
            },
          ],
        });
        return await verifyWalletChain();
      } catch (addError) {
        errorFxn(PaimaMiddlewareErrorCode.ERROR_ADDING_CHAIN, addError);
        return false;
      }
    } else {
      errorFxn(PaimaMiddlewareErrorCode.ERROR_SWITCHING_TO_CHAIN, switchError);
      return false;
    }
  }
}

export async function verifyWalletChain(): Promise<boolean> {
  try {
    return window.ethereum
      .request({ method: 'eth_chainId' })
      .then(res => parseInt(res as string) === getChainId());
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function signMessageEth(userAddress: string, message: string): Promise<string> {
  const hexMessage = utf8ToHex(message);
  const signature = await window.ethereum.request({
    method: 'personal_sign',
    params: [hexMessage, userAddress, ''],
  });
  if (typeof signature !== 'string') {
    pushLog('[signMessageEth] invalid signature:', signature);
    throw new Error(`[signMessageEth] Received signature of type ${typeof signature}`);
  }
  return signature;
}

export async function initAccountGuard() {
  // Update the selected Eth address if the user changes after logging in.
  window.ethereum.on('accountsChanged', newAccounts => {
    const accounts = newAccounts as string[];
    if (!accounts || !accounts[0] || accounts[0] !== getActiveAddress()) {
      setEthAddress('');
    }
  });
}

export async function checkEthWalletStatus(): Promise<OldResult> {
  const errorFxn = buildEndpointErrorFxn('checkEthWalletStatus');

  if (getEthAddress() === '') {
    return errorFxn(PaimaMiddlewareErrorCode.NO_ADDRESS_SELECTED);
  }

  try {
    if (!(await verifyWalletChain())) {
      return errorFxn(PaimaMiddlewareErrorCode.METAMASK_WRONG_CHAIN);
    }
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.METAMASK_CHAIN_VERIFICATION, err);
  }

  return { success: true, message: '' };
}

export async function metamaskLoginWrapper(): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('metamaskLoginWrapper');

  if (typeof window.ethereum === 'undefined') {
    return errorFxn(
      PaimaMiddlewareErrorCode.METAMASK_NOT_INSTALLED,
      undefined,
      FE_ERR_METAMASK_NOT_INSTALLED
    );
  }

  try {
    await rawWalletLogin();
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.METAMASK_LOGIN);
  }

  try {
    await updateFee();
  } catch (err) {
    errorFxn(PaimaMiddlewareErrorCode.ERROR_UPDATING_FEE, err);
    // The fee has a default value, so this is not fatal and we can continue.
    // If the fee has increased beyond the default value, posting won't work.
  }
  try {
    if (!(await verifyWalletChain())) {
      if (!(await switchChain())) {
        return errorFxn(PaimaMiddlewareErrorCode.METAMASK_CHAIN_SWITCH);
      }
    }
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.METAMASK_CHAIN_SWITCH, err);
  }

  return {
    success: true,
    result: {
      walletAddress: getEthAddress(),
    },
  };
}
