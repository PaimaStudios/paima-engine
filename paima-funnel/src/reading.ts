import type Web3 from 'web3';
import type { BlockTransactionString } from 'web3-eth';
import type { StorageContract } from '@paima/utils';
import pkg from 'web3-utils';

import type { ChainData, SubmittedChainData } from '@paima/utils';
import { doLog } from '@paima/utils';

import { processDataUnit } from './batch-processing.js';
import type { PaimaGameInteraction } from '@paima/utils/src/contract-types/Storage';

const { hexToUtf8 } = pkg;

async function getSubmittedData(
  web3: Web3,
  block: BlockTransactionString,
  events: PaimaGameInteraction[]
): Promise<SubmittedChainData[]> {
  const eventMapper = (e: PaimaGameInteraction): Promise<SubmittedChainData[]> => {
    const data = e.returnValues.data;
    const decodedData = data && data.length > 0 ? hexToUtf8(data) : '';
    return processDataUnit(
      web3,
      {
        userAddress: e.returnValues.userAddress,
        inputData: decodedData,
        inputNonce: '',
        suppliedValue: e.returnValues.value,
      },
      block.number
    );
  };

  const unflattenedList = await Promise.all(events.map(eventMapper));
  return unflattenedList.flat();
}

async function processBlock(
  blockNumber: number,
  web3: Web3,
  storage: StorageContract
): Promise<ChainData> {
  try {
    const [block, events] = await Promise.all([
      web3.eth.getBlock(blockNumber),
      // TOOD: typechain is missing the proper type generation for getPastEvents
      // https://github.com/dethcrypto/TypeChain/issues/767
      storage.getPastEvents('PaimaGameInteraction', {
        fromBlock: blockNumber,
        toBlock: blockNumber,
      }) as unknown as Promise<PaimaGameInteraction[]>,
    ]);

    return {
      timestamp: block.timestamp,
      blockHash: block.hash,
      blockNumber: block.number,
      submittedData: await getSubmittedData(web3, block, events),
    };
  } catch (err) {
    doLog(`[funnel::processBlock] caught ${err}`);
    throw err;
  }
}

export async function internalReadDataMulti(
  web3: Web3,
  storage: StorageContract,
  fromBlock: number,
  toBlock: number
): Promise<ChainData[]> {
  if (toBlock < fromBlock) {
    return [];
  }
  const blockPromises: Promise<ChainData>[] = [];
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
    return (
      resList
        .slice(0, firstRejected)
        // note: we cast the promise to be a successfully fulfilled promise
        // we know this is safe because the above-line sliced up until the first rejection
        .map(elem => (elem as PromiseFulfilledResult<ChainData>).value)
    );
  });
}

export async function internalReadDataSingle(
  web3: Web3,
  storage: StorageContract,
  fromBlock: number
): Promise<ChainData> {
  return await processBlock(fromBlock, web3, storage);
}

// Timeout function for promises
export const timeout = <T>(prom: Promise<T>, time: number): Promise<Awaited<T>> =>
  Promise.race([prom, new Promise<T>((_resolve, reject) => setTimeout(reject, time))]);
