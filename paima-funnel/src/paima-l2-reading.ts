import type Web3 from 'web3';

import { timeout, cutAfterFirstRejected } from '@paima/utils';
import type { BlockData, BlockSubmittedData, SubmittedData, PaimaL2Contract } from '@paima/utils';
import type { PaimaGameInteraction } from '@paima/utils/src/contract-types/PaimaL2Contract';

import { extractSubmittedData } from './data-processing.js';

const DEFAULT_TIMEOUT = 5000;

export async function getBlockData(web3: Web3, blockNumber: number): Promise<BlockData> {
  const block = await timeout(web3.eth.getBlock(blockNumber), DEFAULT_TIMEOUT);
  return {
    timestamp: block.timestamp,
    blockHash: block.hash,
    blockNumber: block.number,
  };
}

export async function getMultipleBlockData(
  web3: Web3,
  fromBlock: number,
  toBlock: number
): Promise<BlockData[]> {
  const blockPromises: Promise<BlockData>[] = [];
  for (let i = fromBlock; i <= toBlock; i++) {
    blockPromises.push(getBlockData(web3, i));
  }
  const blockResults = await Promise.allSettled(blockPromises);
  return cutAfterFirstRejected(blockResults);
}

export async function getSubmittedDataMulti(
  web3: Web3,
  paimaL2Contract: PaimaL2Contract,
  fromBlock: number,
  toBlock: number
): Promise<BlockSubmittedData[]> {
  const events = await getPaimaEvents(paimaL2Contract, fromBlock, toBlock);
  const resultList: BlockSubmittedData[] = [];
  for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber++) {
    const blockEvents = events.filter(e => e.blockNumber === blockNumber);
    resultList.push({
      blockNumber,
      submittedData: await extractSubmittedData(web3, blockEvents),
    });
  }
  return resultList;
}

export async function getSubmittedDataSingle(
  web3: Web3,
  paimaL2Contract: PaimaL2Contract,
  blockNumber: number
): Promise<SubmittedData[]> {
  const events = await getPaimaEvents(paimaL2Contract, blockNumber, blockNumber);
  return await extractSubmittedData(web3, events);
}

async function getPaimaEvents(
  paimaL2Contract: PaimaL2Contract,
  fromBlock: number,
  toBlock: number
): Promise<PaimaGameInteraction[]> {
  // TOOD: typechain is missing the proper type generation for getPastEvents
  // https://github.com/dethcrypto/TypeChain/issues/767
  return (await timeout(
    paimaL2Contract.getPastEvents('PaimaGameInteraction', {
      fromBlock,
      toBlock,
    }),
    DEFAULT_TIMEOUT
  )) as unknown as PaimaGameInteraction[];
}
