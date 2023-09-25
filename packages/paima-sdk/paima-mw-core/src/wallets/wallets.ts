import { buildEndpointErrorFxn, FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED } from '../errors';
import {
  setBatchedAlgorandMode,
  setBatchedCardanoMode,
  setBatchedEthMode,
  setBatchedPolkadotMode,
  setUnbatchedMode,
} from '../state';
import type { Result, Wallet } from '../types';
import { algorandLoginWrapper } from './algorand';
import { cardanoLoginWrapper } from './cardano';
import { evmLoginWrapper } from './evm';
import { polkadotLoginWrapper } from './polkadot';
import { WalletMode } from './wallet-modes';

export function stringToWalletMode(loginType: string): WalletMode {
  switch (loginType) {
    case 'metamask':
      return WalletMode.METAMASK;
    case 'evm-flint':
      return WalletMode.EVM_FLINT;
    case 'cardano':
      return WalletMode.CARDANO;
    case 'flint':
      return WalletMode.CARDANO_FLINT;
    case 'nufi':
      return WalletMode.CARDANO_NUFI;
    case 'nami':
      return WalletMode.CARDANO_NAMI;
    case 'eternl':
      return WalletMode.CARDANO_ETERNL;
    case 'polkadot':
      return WalletMode.POLKADOT;
    case 'pera':
      return WalletMode.ALGORAND_PERA;
    default:
      return WalletMode.NO_WALLET;
  }
}

export async function specificWalletLogin(
  walletMode: WalletMode,
  preferBatchedMode: boolean
): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('specificWalletLogin');

  switch (walletMode) {
    case WalletMode.METAMASK:
    case WalletMode.EVM_FLINT:
      if (preferBatchedMode) {
        setBatchedEthMode();
      } else {
        setUnbatchedMode();
      }
      return await evmLoginWrapper(walletMode);
    case WalletMode.CARDANO:
    case WalletMode.CARDANO_FLINT:
    case WalletMode.CARDANO_NUFI:
    case WalletMode.CARDANO_NAMI:
    case WalletMode.CARDANO_ETERNL:
      setBatchedCardanoMode();
      return await cardanoLoginWrapper(walletMode);
    case WalletMode.POLKADOT:
      setBatchedPolkadotMode();
      return await polkadotLoginWrapper();
    case WalletMode.ALGORAND_PERA:
      setBatchedAlgorandMode();
      return await algorandLoginWrapper();
    default:
      return errorFxn(FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED);
  }
}
