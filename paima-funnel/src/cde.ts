import type Web3 from 'web3';

import { ChainDataExtensionType, getErc20Contract, getErc721Contract } from '@paima/utils';
import type {
  ChainDataExtension,
  ChainDataExtensionDatum,
  InstantiatedChainDataExtension,
} from '@paima/utils';

import getCdeErc20Data from './cde-erc20';
import getCdeErc721Data from './cde-erc721';

export async function getAllCdeData(
  web3: Web3,
  extensions: InstantiatedChainDataExtension[],
  fromBlock: number,
  toBlock: number
): Promise<ChainDataExtensionDatum[][]> {
  if (fromBlock > toBlock) {
    return extensions.map(_ => []);
  }
  const allData = await Promise.all(
    extensions.map(extension => getSpecificCdeData(web3, extension, fromBlock, toBlock))
  );
  return allData;
}

async function getSpecificCdeData(
  web3: Web3,
  extension: InstantiatedChainDataExtension,
  fromBlock: number,
  toBlock: number
): Promise<ChainDataExtensionDatum[]> {
  if (fromBlock > toBlock || toBlock < extension.startBlockHeight) {
    return [];
  } else if (fromBlock < extension.startBlockHeight) {
    fromBlock = extension.startBlockHeight;
  }
  switch (extension.cdeType) {
    case ChainDataExtensionType.ERC20:
      return await getCdeErc20Data(web3, extension, fromBlock, toBlock);
    case ChainDataExtensionType.ERC721:
      return await getCdeErc721Data(web3, extension, fromBlock, toBlock);
    default:
      throw new Error('[funnel] Invalid CDE type!');
  }
}

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
