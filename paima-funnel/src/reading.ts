import type Web3 from 'web3';

import type { PaimaL2Contract } from '@paima/utils';
import type { ChainData } from '@paima/utils';
import { doLog } from '@paima/utils';
import type { PaimaGameInteraction } from '@paima/utils/src/contract-types/PaimaL2Contract';

import { extractSubmittedData } from './data-processing.js';

export async function processBlock(
  web3: Web3,
  storage: PaimaL2Contract,
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
    doLog(`[funnel::processBlock] at ${blockNumber} caught ${err}`);
    throw err;
  }
}
