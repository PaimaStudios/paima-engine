import type Web3 from 'web3';

import type {
  BlockData,
  ChainData,
  InstantiatedChainDataExtension,
  PaimaL2Contract,
  SubmittedData,
} from '@paima/utils';
import { doLog } from '@paima/utils';
import type { PaimaGameInteraction } from '@paima/utils/src/contract-types/PaimaL2Contract';

import { extractSubmittedData } from './data-processing.js';
import { getAllCdeData } from './cde.js';

export async function processBlock(
  web3: Web3,
  paimaL2Contract: PaimaL2Contract,
  extensions: InstantiatedChainDataExtension[],
  blockNumber: number
): Promise<ChainData> {
  try {
    const [blockData, submittedData, cdeData] = await Promise.all([
      getBlockData(web3, blockNumber),
      getSubmittedData(web3, paimaL2Contract, blockNumber, blockNumber),
      getAllCdeData(web3, extensions, blockNumber, blockNumber),
    ]);

    return {
      ...blockData,
      submittedData,
      extensionDatums: cdeData.flat(),
    };
  } catch (err) {
    doLog(`[funnel::processBlock] at ${blockNumber} caught ${err}`);
    throw err;
  }
}

export async function getBlockData(web3: Web3, blockNumber: number): Promise<BlockData> {
  const block = await web3.eth.getBlock(blockNumber);
  return {
    timestamp: block.timestamp,
    blockHash: block.hash,
    blockNumber: block.number,
  };
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
