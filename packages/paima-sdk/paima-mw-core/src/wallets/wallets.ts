import assertNever from 'assert-never';
import { buildEndpointErrorFxn, FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED } from '../errors';
import {
  setBatchedAlgorandMode,
  setBatchedCardanoMode,
  setBatchedEthMode,
  setBatchedPolkadotMode,
  setUnbatchedMode,
} from '../state';
import type { LoginInfo, Result, Wallet } from '../types';
import { algorandLoginWrapper } from './algorand';
import { cardanoLoginWrapper } from './cardano';
import { evmLoginWrapper } from './evm';
import { polkadotLoginWrapper } from './polkadot';
import { WalletMode } from './wallet-modes';

export async function specificWalletLogin(loginInfo: LoginInfo): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('specificWalletLogin');

  switch (loginInfo.mode) {
    case WalletMode.EVM:
      if (loginInfo.preferBatchedMode) {
        setBatchedEthMode();
      } else {
        setUnbatchedMode();
      }
      return await evmLoginWrapper(loginInfo);
    case WalletMode.CARDANO:
      setBatchedCardanoMode();
      return await cardanoLoginWrapper(loginInfo);
    case WalletMode.POLKADOT:
      setBatchedPolkadotMode();
      return await polkadotLoginWrapper(loginInfo);
    case WalletMode.ALGORAND:
      setBatchedAlgorandMode();
      return await algorandLoginWrapper(loginInfo);
    case WalletMode.NO_WALLET:
      return errorFxn(FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED);
    default:
      assertNever(loginInfo, true);
      return errorFxn(FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED);
  }
}
