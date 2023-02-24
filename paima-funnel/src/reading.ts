import type Web3 from 'web3';

import type { StorageContract } from '@paima/utils';
import type { ChainData } from '@paima/utils';
import { doLog } from '@paima/utils';
import type { PaimaGameInteraction } from '@paima/utils/src/contract-types/Storage';

import { extractSubmittedData } from './data-processing.js';
import { timeout } from './utils.js';

async function processBlock(
  web3: Web3,
  storage: StorageContract,
  blockNumber: number
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
      submittedData: await extractSubmittedData(web3, block, events),
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
    const block = processBlock(web3, storage, i);
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
