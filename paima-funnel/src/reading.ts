import type Web3 from 'web3';
import type { BlockTransactionString } from 'web3-eth';

import { timeout, cutAfterFirstRejected, DEFAULT_FUNNEL_TIMEOUT } from '@paima/utils';
import type { PaimaL2Contract } from '@paima/utils';
import type { ChainData } from '@paima/runtime';
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
    const submittedData = await extractSubmittedData(web3, blockEvents, block.timestamp);
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
  const submittedData = await extractSubmittedData(web3, events, blockData.timestamp);
  return {
    ...blockData,
    submittedData, // merge in the data
  };
}

async function getBlockData(web3: Web3, blockNumber: number): Promise<ChainData> {
  const block = await timeout(web3.eth.getBlock(blockNumber), DEFAULT_FUNNEL_TIMEOUT);
  return blockDataToChainData(block);
}

function blockDataToChainData(block: BlockTransactionString): ChainData {
  const timestamp =
    typeof block.timestamp === 'string' ? parseInt(block.timestamp, 10) : block.timestamp;
  return {
    timestamp: timestamp,
    blockHash: block.hash,
    blockNumber: block.number,
    submittedData: [], // this will be merged in after
  };
}

async function getMultipleBlockData(
  web3: Web3,
  fromBlock: number,
  toBlock: number
): Promise<ChainData[]> {
  const batch = new web3.BatchRequest();

  const blockRange = Array.from({ length: toBlock - fromBlock + 1 }, (_, i) => i + fromBlock);
  const blockPromises = blockRange.map(blockNumber => {
    return new Promise<ChainData>((resolve, reject) => {
      batch.add(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: web3-eth v1 is missing this in its type definitions
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        web3.eth.getBlock.request(blockNumber, (error, result: BlockTransactionString) => {
          if (error) reject(error);
          else resolve(blockDataToChainData(result));
        })
      );
    });
  });

  batch.execute(); // this isn't async in web3 v1. It is async in v4 though
  const blockResults = await Promise.allSettled(blockPromises);
  const truncatedList = cutAfterFirstRejected(blockResults);

  // return the first rejection if all rejections failed
  // this is to fast-fail if all requests failed
  // which matches the behavior of `getBaseChainDataSingle`
  if (truncatedList.length === 0 && blockPromises.length > 0) {
    return (blockResults[0] as PromiseRejectedResult).reason;
  }
  return truncatedList;
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
