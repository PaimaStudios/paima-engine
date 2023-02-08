import { updateFee } from '../helpers/posting';
import { rawWalletLogin } from '../helpers/wallet-metamask';
import { setEthAddress } from '../state';
import { Result, Wallet } from '../types';

// Barebones login example (metamask happy path only with no checks or error handling)
async function userWalletLogin(): Promise<Result<Wallet>> {
  if (typeof window.ethereum === 'undefined') {
    return { success: false, errorMessage: 'Metamask not installed' };
  }

  const userWalletAddress = await rawWalletLogin();
  await updateFee();

  setEthAddress(userWalletAddress);
  return {
    success: true,
    result: {
      address: userWalletAddress,
    },
  };
}

export const accountsEndpoints = {
  userWalletLogin,
};
