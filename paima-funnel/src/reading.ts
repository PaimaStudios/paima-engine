import type Web3 from 'web3';

import { timeout, cutAfterFirstRejected, DEFAULT_FUNNEL_TIMEOUT } from '@paima/utils';
import type { PaimaL2Contract } from '@paima/utils';
import type { BlockData, ChainData } from '@paima/runtime';
import type { PaimaGameInteraction } from '@paima/utils/src/contract-types/PaimaL2Contract';

import { extractSubmittedData } from './paima-l2-processing.js';

export async function getBaseChainDataMulti(
  web3: Web3,
  paimaL2Contract: PaimaL2Contract,
  fromBlock: number,
  toBlock: number
): Promise<ChainData[]> {
  const [blockData, events] = await Promise.all([
    getMultipleBlockData(web3, fromBlock, toBlock),
    getPaimaEvents(paimaL2Contract, fromBlock, toBlock),
  ]);
  const resultList: ChainData[] = [];
  for (const block of blockData) {
    const blockEvents = events.filter(e => e.blockNumber === block.blockNumber);
    const submittedData = await extractSubmittedData(web3, blockEvents);
    resultList.push({
      ...block,
      submittedData,
    });
  }
  return resultList;
}

export async function getBaseChainDataSingle(
  web3: Web3,
  paimaL2Contract: PaimaL2Contract,
  blockNumber: number
): Promise<ChainData> {
  const [blockData, events] = await Promise.all([
    getBlockData(web3, blockNumber),
    getPaimaEvents(paimaL2Contract, blockNumber, blockNumber),
  ]);
  const submittedData = await extractSubmittedData(web3, events);
  return {
    ...blockData,
    submittedData,
  };
}

async function getBlockData(web3: Web3, blockNumber: number): Promise<BlockData> {
  const block = await timeout(web3.eth.getBlock(blockNumber), DEFAULT_FUNNEL_TIMEOUT);
  return {
    timestamp: block.timestamp,
    blockHash: block.hash,
    blockNumber: block.number,
  };
}

async function getMultipleBlockData(
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
    DEFAULT_FUNNEL_TIMEOUT
  )) as unknown as PaimaGameInteraction[];
}
