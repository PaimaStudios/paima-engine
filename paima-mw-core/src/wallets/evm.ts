import pkg from 'web3-utils';

import type { UserSignature } from '@paima/utils';

import {
  buildEndpointErrorFxn,
  PaimaMiddlewareErrorCode,
  FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED,
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
  getEvmActiveWallet,
  getEvmApi,
  setEthAddress,
  setEvmActiveWallet,
  setEvmApi,
} from '../state';
import type { EvmApi, OldResult, Result, Wallet } from '../types';
import { pushLog } from '../helpers/logging';
import { updateFee } from '../helpers/posting';

import { WalletMode } from './wallet-modes';

/**
 * NOTE: https://eips.ethereum.org/EIPS/eip-5749
 */

const SUPPORTED_WALLET_IDS = ['flint', 'metamask'];

const { utf8ToHex } = pkg;

interface SwitchError {
  code: number;
}

async function rawWalletLogin(): Promise<string> {
  const accounts = (await getEvmApi()?.request({
    method: 'eth_requestAccounts',
  })) as string[];
  if (!accounts || accounts.length === 0) {
    throw new Error('Unknown error while receiving accounts');
  }
  setEthAddress(accounts[0]);
  return accounts[0];
}

export async function sendWalletTransaction(tx: Record<string, any>): Promise<string> {
  const hash = await getEvmApi()?.request({
    method: 'eth_sendTransaction',
    params: [tx],
  });
  if (typeof hash !== 'string') {
    pushLog('[sendWalletTransaction] invalid signature:', hash);
    throw new Error(`[sendWalletTransaction] Received "hash" of type ${typeof hash}`);
  }
  return hash;
}

async function switchChain(): Promise<boolean> {
  const errorFxn = buildEndpointErrorFxn('switchChain');

  const CHAIN_NOT_ADDED_ERROR_CODE = 4902;
  const hexChainId = '0x' + getChainId().toString(16);

  try {
    await getEvmApi()?.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    });
    return await verifyWalletChain();
  } catch (switchError) {
    // This error code indicates that the chain has not been added to the wallet.
    const se = switchError as SwitchError;
    if (se.hasOwnProperty('code') && se.code === CHAIN_NOT_ADDED_ERROR_CODE) {
      try {
        await getEvmApi()?.request({
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

async function verifyWalletChain(): Promise<boolean> {
  try {
    const walletChain = await getEvmApi()?.request({ method: 'eth_chainId' });
    return parseInt(walletChain as string) === getChainId();
  } catch (e) {
    pushLog('[verifyWalletChain] error:', e);
    return false;
  }
}

export async function signMessageEth(userAddress: string, message: string): Promise<UserSignature> {
  const hexMessage = utf8ToHex(message);
  const signature = await getEvmApi()?.request({
    method: 'personal_sign',
    params: [hexMessage, userAddress, ''],
  });
  if (typeof signature !== 'string') {
    pushLog('[signMessageEth] invalid signature:', signature);
    throw new Error(`[signMessageEth] Received signature of type ${typeof signature}`);
  }
  return signature;
}

/**
 * Metamask specific address switch detection.
 * Not supported by Flint.
 */
export async function initAccountGuard(): Promise<void> {
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
      return errorFxn(PaimaMiddlewareErrorCode.EVM_WRONG_CHAIN);
    }
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.EVM_CHAIN_VERIFICATION, err);
  }

  return { success: true, message: '' };
}

function evmApiInitialize(walletId: string): void {
  if (getEvmActiveWallet() === walletId) {
    return;
  }

  if (!SUPPORTED_WALLET_IDS.includes(walletId)) {
    throw new Error(`[evmApiInitialize] EVM wallet "${walletId}" not supported`);
  }
  switch (walletId) {
    case 'flint':
      setEvmApi(window.evmproviders?.flint);
      break;
    case 'metamask':
      setEvmApi(window.ethereum as EvmApi);
      break;
  }
}

function evmWalletModeToName(walletMode: WalletMode): string {
  switch (walletMode) {
    case WalletMode.METAMASK:
      return 'metamask';
    case WalletMode.EVM_FLINT:
      return 'flint';
    default:
      return '';
  }
}

export async function evmLoginWrapper(walletMode: WalletMode): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('evmLoginWrapper');

  const walletName = evmWalletModeToName(walletMode);
  if (!walletName) {
    return errorFxn(PaimaMiddlewareErrorCode.WALLET_NOT_SUPPORTED);
  }
  console.log(`[evmLoginWrapper] Attempting to log into ${walletName}`);

  try {
    evmApiInitialize(walletName);

    if (typeof getEvmApi() === 'undefined') {
      return errorFxn(
        PaimaMiddlewareErrorCode.EVM_WALLET_NOT_INSTALLED,
        undefined,
        FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED
      );
    }

    await rawWalletLogin();
    setEvmActiveWallet(walletName);
  } catch (err) {
    console.log(`[evmLoginWrapper] Error while logging into wallet ${walletName}`);

    return errorFxn(PaimaMiddlewareErrorCode.EVM_LOGIN, err);
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
        return errorFxn(PaimaMiddlewareErrorCode.EVM_CHAIN_SWITCH);
      }
    }
  } catch (err) {
    return errorFxn(PaimaMiddlewareErrorCode.EVM_CHAIN_SWITCH, err);
  }

  return {
    success: true,
    result: {
      walletAddress: getEthAddress().toLocaleLowerCase(),
    },
  };
}
