import {
  buildEndpointErrorFxn,
  PaimaMiddlewareErrorCode,
  FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED,
} from '../errors';
import {
  getChainCurrencyDecimals,
  getChainCurrencyName,
  getChainCurrencySymbol,
  getChainExplorerUri,
  getChainId,
  getChainName,
  getChainUri,
  getGameName,
} from '../state';
import type { OldResult, Result, Wallet } from '../types';
import { updateFee } from '../helpers/posting';

import { WalletMode } from './wallet-modes';
import { EvmConnector, UnsupportedWallet, WalletNotFound } from '@paima/providers';

interface SwitchError {
  code: number;
}

async function switchChain(): Promise<boolean> {
  const errorFxn = buildEndpointErrorFxn('switchChain');

  const CHAIN_NOT_ADDED_ERROR_CODE = 4902;
  const hexChainId = '0x' + getChainId().toString(16);

  try {
    await EvmConnector.instance().getOrThrowProvider().switchChain(hexChainId);
    return await verifyWalletChain();
  } catch (switchError) {
    // This error code indicates that the chain has not been added to the wallet.
    const se = switchError as SwitchError;
    if (se.hasOwnProperty('code') && se.code === CHAIN_NOT_ADDED_ERROR_CODE) {
      try {
        await EvmConnector.instance()
          .getOrThrowProvider()
          .addChain({
            chainId: hexChainId,
            chainName: getChainName(),
            nativeCurrency: {
              name: getChainCurrencyName(),
              symbol: getChainCurrencySymbol(),
              decimals: getChainCurrencyDecimals(),
            },
            rpcUrls: [getChainUri()],
            // blockExplorerUrls: Chain not added with empty string.
            blockExplorerUrls: getChainExplorerUri() ? [getChainExplorerUri()] : undefined,
          });
        await EvmConnector.instance()
          .getOrThrowProvider()
          .switchChain(hexChainId);
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
  return await EvmConnector.instance().getOrThrowProvider().verifyWalletChain();
}

export async function checkEthWalletStatus(): Promise<OldResult> {
  const errorFxn = buildEndpointErrorFxn('checkEthWalletStatus');

  if (EvmConnector.instance().getProvider() === null) {
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
    await EvmConnector.instance().connectNamed(
      {
        gameName: getGameName(),
        gameChainId: '0x' + getChainId().toString(16),
      },
      walletName
    );
  } catch (err) {
    if (err instanceof WalletNotFound || err instanceof UnsupportedWallet) {
      return errorFxn(
        PaimaMiddlewareErrorCode.CARDANO_WALLET_NOT_INSTALLED,
        undefined,
        FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED
      );
    }
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
      walletAddress: EvmConnector.instance().getOrThrowProvider().getAddress().toLocaleLowerCase(),
    },
  };
}
