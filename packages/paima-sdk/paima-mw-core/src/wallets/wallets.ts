import assertNever from 'assert-never';
import { buildEndpointErrorFxn, FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED } from '../errors';
import type { LoginInfo, Result, Wallet } from '../types';
import { algorandLoginWrapper } from './algorand';
import { cardanoLoginWrapper } from './cardano';
import { evmLoginWrapper } from './evm/injected';
import { polkadotLoginWrapper } from './polkadot';
import { ethersLoginWrapper } from './evm/ethers';
import type { IProvider } from '@paima/providers';
import { WalletMode } from '@paima/providers';
import { PostingMode, addLogin, setDefaultProvider, setPostingMode } from '../state';

export async function specificWalletLogin(
  loginInfo: LoginInfo,
  setDefault: boolean = true
): Promise<Result<Wallet>> {
  const errorFxn = buildEndpointErrorFxn('specificWalletLogin');

  const provider = await (async (): Promise<Result<IProvider<unknown>>> => {
    switch (loginInfo.mode) {
      case WalletMode.EvmInjected: {
        return await evmLoginWrapper(loginInfo);
      }
      case WalletMode.EvmEthers: {
        return await ethersLoginWrapper(loginInfo);
      }
      case WalletMode.Cardano: {
        return await cardanoLoginWrapper(loginInfo);
      }
      case WalletMode.Polkadot: {
        return await polkadotLoginWrapper(loginInfo);
      }
      case WalletMode.Algorand: {
        return await algorandLoginWrapper(loginInfo);
      }
      default:
        assertNever(loginInfo, true);
        return errorFxn(FE_ERR_SPECIFIC_WALLET_NOT_INSTALLED);
    }
  })();
  if (provider.success === false) return provider;

  if (setDefault) {
    setDefaultProvider(provider.result);
  }
  addLogin(loginInfo.mode);

  const postingMode = ((): PostingMode => {
    if ('preferBatchedMode' in loginInfo) {
      return loginInfo.preferBatchedMode ? PostingMode.BATCHED : PostingMode.UNBATCHED;
    }
    return PostingMode.BATCHED;
  })();

  setPostingMode(provider.result, postingMode);
  return { success: true, result: { walletAddress: provider.result.getAddress().address } };
}
