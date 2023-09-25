import type Web3 from 'web3';

import { ChainDataExtensionType } from '@paima/utils';
import type { ChainDataExtensionDatum, ChainDataExtension } from '@paima/runtime';

import getCdeErc20Data from './erc20';
import getCdeErc721Data from './erc721';
import getCdePaimaErc721Data from './paimaErc721';
import getCdeErc20DepositData from './erc20Deposit';
import getCdeGenericData from './generic';

export async function getUngroupedCdeData(
  web3: Web3,
  extensions: ChainDataExtension[],
  fromBlock: number,
  toBlock: number
): Promise<ChainDataExtensionDatum[][]> {
  if (fromBlock > toBlock) {
    return extensions.map(_ => []);
  }
  const allData = await Promise.all(
    extensions.map(extension => getSpecificCdeData(extension, fromBlock, toBlock))
  );
  return allData;
}

async function getSpecificCdeData(
  extension: ChainDataExtension,
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
      return await getCdeErc20Data(extension, fromBlock, toBlock);
    case ChainDataExtensionType.ERC721:
      return await getCdeErc721Data(extension, fromBlock, toBlock);
    case ChainDataExtensionType.PaimaERC721:
      return await getCdePaimaErc721Data(extension, fromBlock, toBlock);
    case ChainDataExtensionType.ERC20Deposit:
      return await getCdeErc20DepositData(extension, fromBlock, toBlock);
    case ChainDataExtensionType.Generic:
      return await getCdeGenericData(extension, fromBlock, toBlock);
    default:
      throw new Error('[funnel] Invalid CDE type!');
  }
}
