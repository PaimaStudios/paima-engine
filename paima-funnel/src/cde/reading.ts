import type Web3 from 'web3';

import { ChainDataExtensionType } from '@paima/utils';
import type { ChainDataExtensionDatum, InstantiatedChainDataExtension } from '@paima/utils-backend';

import getCdeErc20Data from './erc20';
import getCdeErc721Data from './erc721';

export async function getUngroupedCdeData(
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
