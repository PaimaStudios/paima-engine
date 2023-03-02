import { buildEndpointErrorFxn, FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED } from '../errors';
import { setBatchedCardanoMode, setBatchedPolkadotMode, setUnbatchedMode } from '../state';
import { Result, Wallet } from '../types';
import { cardanoLoginWrapper } from './cardano';
import { metamaskLoginWrapper } from './metamask';
import { polkadotLoginWrapper } from './polkadot';
import { WalletMode } from './wallet-modes';

export function stringToWalletMode(loginType: string): WalletMode {
  switch (loginType) {
    case 'metamask':
      return WalletMode.METAMASK;
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
    default:
      return WalletMode.NO_WALLET;
  }
}

export async function specificWalletLogin(walletMode: WalletMode): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('specificWalletLogin');

  switch (walletMode) {
    case WalletMode.METAMASK:
      setUnbatchedMode();
      return metamaskLoginWrapper();
    case WalletMode.CARDANO_FLINT:
    case WalletMode.CARDANO_NUFI:
    case WalletMode.CARDANO_NAMI:
    case WalletMode.CARDANO_ETERNL:
      setBatchedCardanoMode();
      return cardanoLoginWrapper(walletMode);
    case WalletMode.POLKADOT:
      setBatchedPolkadotMode();
      return polkadotLoginWrapper();
    default:
      return errorFxn(FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED);
  }
}
