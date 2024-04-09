import type Web3 from 'web3';

import { ChainDataExtensionType } from '@paima/utils';
import type { ChainDataExtensionDatum, ChainDataExtension } from '@paima/sm';

import getCdeGenericData from './generic.js';
import getCdeErc20Data from './erc20.js';
import getCdeErc20DepositData from './erc20Deposit.js';
import getCdeErc721Data from './erc721.js';
import getCdePaimaErc721Data from './paimaErc721.js';
import getCdeErc6551RegistryData from './erc6551Registry.js';
import getCdeErc1155Data from './erc1155.js';
import assertNever from 'assert-never';

export async function getUngroupedCdeData(
  web3: Web3,
  extensions: ChainDataExtension[],
  fromBlock: number,
  toBlock: number,
  network: string
): Promise<ChainDataExtensionDatum[][]> {
  if (fromBlock > toBlock) {
    return extensions.map(_ => []);
  }
  const allData = await Promise.all(
    extensions.map(extension =>
      'startBlockHeight' in extension
        ? getSpecificCdeData(extension, fromBlock, toBlock, network)
        : []
    )
  );
  return allData;
}

async function getSpecificCdeData(
  extension: ChainDataExtension & { startBlockHeight: number },
  fromBlock: number,
  toBlock: number,
  network: string
): Promise<ChainDataExtensionDatum[]> {
  if (fromBlock > toBlock || toBlock < extension.startBlockHeight) {
    return [];
  } else if (fromBlock < extension.startBlockHeight) {
    fromBlock = extension.startBlockHeight;
  }
  switch (extension.cdeType) {
    case ChainDataExtensionType.Generic:
      return await getCdeGenericData(extension, fromBlock, toBlock, network);
    case ChainDataExtensionType.ERC20:
      return await getCdeErc20Data(extension, fromBlock, toBlock, network);
    case ChainDataExtensionType.ERC20Deposit:
      return await getCdeErc20DepositData(extension, fromBlock, toBlock, network);
    case ChainDataExtensionType.ERC721:
      return await getCdeErc721Data(extension, fromBlock, toBlock, network);
    case ChainDataExtensionType.PaimaERC721:
      return await getCdePaimaErc721Data(extension, fromBlock, toBlock, network);
    case ChainDataExtensionType.ERC1155:
      return await getCdeErc1155Data(extension, fromBlock, toBlock, network);
    case ChainDataExtensionType.ERC6551Registry:
      return await getCdeErc6551RegistryData(extension, fromBlock, toBlock, network);
    // these are not used by the block funnel
    case ChainDataExtensionType.CardanoPool:
    case ChainDataExtensionType.CardanoProjectedNFT:
    case ChainDataExtensionType.CardanoAssetUtxo:
    case ChainDataExtensionType.CardanoTransfer:
    case ChainDataExtensionType.CardanoMintBurn:
    case ChainDataExtensionType.MinaEventGeneric:
    case ChainDataExtensionType.MinaActionGeneric:
      return [];
    default:
      assertNever(extension);
  }
}
