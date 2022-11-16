import type Web3 from 'web3';
import type { Contract } from 'web3-eth-contract';
import pkg from 'web3-utils';

import type { ChainData } from '@paima/utils';
import { doLog } from '@paima/utils';

import { processDataUnit } from './batch-processing.js';

const { hexToUtf8 } = pkg;

interface PromiseFulfilledResult<T> {
  status: 'fulfilled';
  value: T;
}

async function processBlock(
  blockNumber: number,
  web3: Web3,
  storage: Contract
): Promise<ChainData> {
  try {
    const [block, events] = await Promise.all([
      web3.eth.getBlock(blockNumber),
      storage.getPastEvents('PaimaGameInteraction', {
        fromBlock: blockNumber,
        toBlock: blockNumber,
      }),
    ]);
    return {
      timestamp: block.timestamp,
      blockHash: block.hash,
      blockNumber: block.number,
      submittedData: (
        await Promise.all(
          events.map(function (e) {
            const data: string = e.returnValues.data;
            const decodedData = data && data.length > 0 ? hexToUtf8(data) : '';
            return processDataUnit(
              web3,
              {
                userAddress: e.returnValues.userAddress,
                inputData: decodedData,
                inputNonce: '',
              },
              block.number
            );
          })
        )
      ).flat(),
    };
  } catch (err) {
    doLog(`[funnel::processBlock] caught ${err}`);
    throw err;
  }
}

export async function internalReadDataMulti(
  web3: Web3,
  storage: Contract,
  fromBlock: number,
  toBlock: number
): Promise<ChainData[]> {
  if (toBlock < fromBlock) {
    return [];
  }
  let blockPromises: Promise<ChainData>[] = [];
  for (let i = fromBlock; i <= toBlock; i++) {
    const block = processBlock(i, web3, storage);
    const timeoutBlock = timeout(block, 5000);
    blockPromises.push(timeoutBlock);
  }
  return await Promise.allSettled(blockPromises).then(resList => {
    let firstRejected = resList.findIndex(elem => elem.status === 'rejected');
    if (firstRejected < 0) {
      firstRejected = resList.length;
    }
    return resList
      .slice(0, firstRejected)
      .map(elem => (elem as PromiseFulfilledResult<ChainData>).value);
  });
}

export async function internalReadDataSingle(
  web3: Web3,
  storage: Contract,
  fromBlock: number
): Promise<ChainData> {
  return await processBlock(fromBlock, web3, storage);
}

// Timeout function for promises
export const timeout = <T>(prom: Promise<T>, time: number): Promise<Awaited<T>> =>
  Promise.race([prom, new Promise<T>((_resolve, reject) => setTimeout(reject, time))]);
