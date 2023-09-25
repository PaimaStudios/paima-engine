import { MetaMaskInpageProvider } from '@metamask/providers';

declare global {
  interface Window {
    ethereum: MetaMaskInpageProvider;
    evmproviders?: {
      // API should be the same as MetaMask
      flint: MetaMaskInpageProvider;
    };
  }
}
