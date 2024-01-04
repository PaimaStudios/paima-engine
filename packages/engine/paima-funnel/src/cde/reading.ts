import type Web3 from 'web3';

import { ChainDataExtensionType } from '@paima/utils';
import type { ChainDataExtensionDatum, ChainDataExtension } from '@paima/sm';

import getCdeErc20Data from './erc20.js';
import getCdeErc721Data from './erc721.js';
import getCdePaimaErc721Data from './paimaErc721.js';
import getCdeErc20DepositData from './erc20Deposit.js';
import getCdeGenericData from './generic.js';
import getCdeErc6551RegistryData from './erc6551Registry.js';
import assertNever from 'assert-never';

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
    extensions.map(extension =>
      'startBlockHeight' in extension ? getSpecificCdeData(extension, fromBlock, toBlock) : []
    )
  );
  return allData;
}

async function getSpecificCdeData(
  extension: ChainDataExtension & { startBlockHeight: number },
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
    case ChainDataExtensionType.ERC6551Registry:
      return await getCdeErc6551RegistryData(extension, fromBlock, toBlock);
    case ChainDataExtensionType.CardanoPool:
      // this is used by the block funnel, which can't get information for this
      // extension
      return [];
    case ChainDataExtensionType.CardanoProjectedNFT:
      // this is used by the block funnel, which can't get information for this
      // extension
      return [];
    default:
      assertNever(extension);
  }
}
