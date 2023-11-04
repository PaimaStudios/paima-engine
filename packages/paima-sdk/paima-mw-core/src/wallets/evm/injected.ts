import { buildEndpointErrorFxn, PaimaMiddlewareErrorCode } from '../../errors.js';
import {
  getChainCurrencyDecimals,
  getChainCurrencyName,
  getChainCurrencySymbol,
  getChainExplorerUri,
  getChainId,
  getChainName,
  getChainUri,
  getGameName,
  hasLogin,
} from '../../state.js';
import type { LoginInfoMap, OldResult, Result } from '../../types.js';
import { updateFee } from '../../helpers/posting.js';

import { connectInjected } from '../wallet-modes.js';
import { WalletMode } from '@paima/providers';
import type { ApiForMode, IProvider } from '@paima/providers';
import { EvmInjectedConnector } from '@paima/providers';

interface SwitchError {
  code: number;
}

async function switchChain(): Promise<boolean> {
  const errorFxn = buildEndpointErrorFxn('switchChain');

  const CHAIN_NOT_ADDED_ERROR_CODE = 4902;
  const hexChainId = '0x' + getChainId().toString(16);

  try {
    await EvmInjectedConnector.instance().getOrThrowProvider().switchChain(hexChainId);
    return await verifyWalletChain();
  } catch (switchError) {
    // This error code indicates that the chain has not been added to the wallet.
    const se = switchError as SwitchError;
    if (se.hasOwnProperty('code') && se.code === CHAIN_NOT_ADDED_ERROR_CODE) {
      try {
        await EvmInjectedConnector.instance()
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
        await EvmInjectedConnector.instance().getOrThrowProvider().switchChain(hexChainId);
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
  return await EvmInjectedConnector.instance().getOrThrowProvider().verifyWalletChain();
}

export async function checkEthWalletStatus(): Promise<OldResult> {
  const errorFxn = buildEndpointErrorFxn('checkEthWalletStatus');

  if (!hasLogin(WalletMode.EvmInjected)) {
    return { success: true, message: '' };
  }
  if (EvmInjectedConnector.instance().getProvider() === null) {
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

export async function evmLoginWrapper(
  loginInfo: LoginInfoMap[WalletMode.EvmInjected]
): Promise<Result<IProvider<ApiForMode<WalletMode.EvmInjected>>>> {
  const errorFxn = buildEndpointErrorFxn('evmLoginWrapper');

  const gameInfo = {
    gameName: getGameName(),
    gameChainId: '0x' + getChainId().toString(16),
  };
  const loginResult = await connectInjected(
    'evmLoginWrapper',
    errorFxn,
    PaimaMiddlewareErrorCode.EVM_LOGIN,
    loginInfo,
    EvmInjectedConnector.instance(),
    gameInfo
  );
  if (loginResult.success === false) {
    return loginResult;
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
    result: loginResult.result,
  };
}
