import type Web3 from 'web3';

import {
  ENV,
  doLog,
  getPaimaL2Contract,
  initWeb3,
  validatePaimaL2ContractAddress,
} from '@paima/utils';
import type { ChainFunnel, ChainData, ChainDataExtension, PaimaL2Contract } from '@paima/utils';
import { loadChainDataExtensions } from '@paima/utils-backend';

import { processBlock } from './reading.js';
import { timeout } from './utils.js';

const GET_BLOCK_NUMBER_TIMEOUT = 5000;

class PaimaFunnel {
  public nodeUrl: string;
  public paimaL2ContractAddress: string;
  public extensions: ChainDataExtension[];
  public web3: Web3;
  public paimaL2Contract: PaimaL2Contract;

  constructor(
    nodeUrl: string,
    paimaL2ContractAddress: string,
    extensions: ChainDataExtension[],
    web3: Web3,
    paimaL2Contract: PaimaL2Contract
  ) {
    this.nodeUrl = nodeUrl;
    this.paimaL2ContractAddress = paimaL2ContractAddress;
    this.extensions = extensions;
    this.web3 = web3;
    this.paimaL2Contract = paimaL2Contract;
  }

  public readData = async (
    blockHeight: number,
    blockCount: number = ENV.DEFAULT_FUNNEL_GROUP_SIZE
  ): Promise<ChainData[]> => {
    try {
      const [fromBlock, toBlock] = await this.adjustBlockHeightRange(blockHeight, blockCount);

      if (fromBlock < 0) {
        return [];
      }

      if (toBlock === fromBlock) {
        doLog(`#${toBlock}`);
      } else {
        doLog(`#${fromBlock}-${toBlock}`);
      }

      return await this.internalReadDataMulti(fromBlock, toBlock);
    } catch (err) {
      doLog(`[paima-funnel::readData] Exception occurred while reading blocks: ${err}`);
      return [];
    }
  };

  // Will return [-1, -2] if the range is determined to be empty.
  // It should be enough to check that fromBlock >= 0,
  // but this will also fail a fromBlock <= toBlock check.
  public adjustBlockHeightRange = async (
    firstBlockHeight: number,
    blockCount: number
  ): Promise<[number, number]> => {
    const ERR_RESULT: [number, number] = [-1, -2];
    try {
      const latestBlock: number = await timeout(
        this.web3.eth.getBlockNumber(),
        GET_BLOCK_NUMBER_TIMEOUT
      );

      const fromBlock = firstBlockHeight;
      const toBlock = Math.min(latestBlock, fromBlock + blockCount - 1);

      if (fromBlock <= toBlock) {
        return [fromBlock, toBlock];
      } else {
        return ERR_RESULT;
      }
    } catch (err) {
      doLog(
        `[paima-funnel] Exception (presumably timeout) occured while getting latest block number: ${err}`
      );
      return ERR_RESULT;
    }
  };

  public internalReadDataMulti = async (
    fromBlock: number,
    toBlock: number
  ): Promise<ChainData[]> => {
    if (toBlock < fromBlock || fromBlock < 0) {
      return [];
    }
    const blockPromises: Promise<ChainData>[] = [];
    for (let i = fromBlock; i <= toBlock; i++) {
      const block = processBlock(this.web3, this.paimaL2Contract, i);
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
  };
}

const paimaFunnelInitializer = {
  async initialize(nodeUrl: string, paimaL2ContractAddress: string): Promise<ChainFunnel> {
    validatePaimaL2ContractAddress(paimaL2ContractAddress);
    const web3 = await initWeb3(nodeUrl);
    const paimaL2Contract = getPaimaL2Contract(paimaL2ContractAddress, web3);
    const extensions = await loadChainDataExtensions();
    return new PaimaFunnel(nodeUrl, paimaL2ContractAddress, extensions, web3, paimaL2Contract);
  },
};

export default paimaFunnelInitializer;
