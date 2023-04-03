import type Web3 from 'web3';

import type {
  ChainDataExtension,
  ChainDataExtensionDatum,
  PaimaL2Contract,
  SubmittedData,
} from '@paima/utils';
import type { ChainData } from '@paima/utils';
import { doLog } from '@paima/utils';
import type { PaimaGameInteraction } from '@paima/utils/src/contract-types/PaimaL2Contract';

import { extractSubmittedData } from './data-processing.js';
import { ChainDataExtensionType } from '@paima/utils/src/constants.js';

import getCdeErc20Data from './cde-erc20';
import getCdeErc721Data from './cde-erc721';

export async function processBlock(
  web3: Web3,
  paimaL2Contract: PaimaL2Contract,
  extensions: ChainDataExtension[],
  blockNumber: number
): Promise<ChainData> {
  try {
    const [block, submittedData, cdeData] = await Promise.all([
      web3.eth.getBlock(blockNumber),
      getSubmittedData(web3, paimaL2Contract, blockNumber, blockNumber),
      getAllCdeData(web3, extensions, blockNumber, blockNumber),
    ]);

    return {
      timestamp: block.timestamp,
      blockHash: block.hash,
      blockNumber: block.number,
      submittedData,
      extensionDatums: cdeData.flat(),
    };
  } catch (err) {
    doLog(`[funnel::processBlock] at ${blockNumber} caught ${err}`);
    throw err;
  }
}

export async function getSubmittedData(
  web3: Web3,
  paimaL2Contract: PaimaL2Contract,
  fromBlock: number,
  toBlock: number
): Promise<SubmittedData[]> {
  // TOOD: typechain is missing the proper type generation for getPastEvents
  // https://github.com/dethcrypto/TypeChain/issues/767
  const events = (await paimaL2Contract.getPastEvents('PaimaGameInteraction', {
    fromBlock,
    toBlock,
  })) as unknown as PaimaGameInteraction[];
  return await extractSubmittedData(web3, events);
}

export async function getAllCdeData(
  web3: Web3,
  extensions: ChainDataExtension[],
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
      return await getCdeErc20Data(web3, extension, fromBlock, toBlock);
    case ChainDataExtensionType.ERC721:
      return await getCdeErc721Data(web3, extension, fromBlock, toBlock);
    default:
      throw new Error('[funnel] Invalid CDE type!');
  }
}
