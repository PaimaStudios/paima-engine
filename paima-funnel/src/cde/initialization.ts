import type Web3 from 'web3';

import { ChainDataExtensionType, getErc20Contract, getErc721Contract } from '@paima/utils';
import type { ChainDataExtension, InstantiatedChainDataExtension } from '@paima/runtime';

export function instantiateExtension(
  web3: Web3,
  extension: ChainDataExtension
): InstantiatedChainDataExtension {
  switch (extension.cdeType) {
    case ChainDataExtensionType.ERC20:
      return {
        ...extension,
        cdeType: ChainDataExtensionType.ERC20,
        contract: getErc20Contract(extension.contractAddress, web3),
      };
    case ChainDataExtensionType.ERC721:
      return {
        ...extension,
        cdeType: ChainDataExtensionType.ERC721,
        contract: getErc721Contract(extension.contractAddress, web3),
      };
    default:
      throw new Error('[funnel] unknown CDE type');
  }
}
