import {
  DEFAULT_FUNNEL_GROUP_SIZE,
  doLog,
  getPaimaL2Contract,
  initWeb3,
  validatePaimaL2ContractAddress,
} from '@paima/utils';

import type { ChainFunnel, ChainData, ChainDataExtension } from '@paima/utils';

import { internalReadDataMulti } from './reading.js';
import { timeout } from './utils.js';

const GET_BLOCK_NUMBER_TIMEOUT = 5000;

// TODO: paimaFunnel here does not correspond to any type definition
const paimaFunnel = {
  async initialize(nodeUrl: string, paimaL2ContractAddress: string): Promise<ChainFunnel> {
    validatePaimaL2ContractAddress(paimaL2ContractAddress);
    const web3 = await initWeb3(nodeUrl);
    const paimaL2Contract = getPaimaL2Contract(paimaL2ContractAddress, web3);
    return {
      nodeUrl,
      paimaL2ContractAddress,
      extensions: [] as ChainDataExtension[],
      web3,
      paimaL2Contract,
      async readData(
        blockHeight: number,
        blockCount: number = DEFAULT_FUNNEL_GROUP_SIZE
      ): Promise<ChainData[]> {
        let blocks: ChainData[] = [];
        let latestBlock: number = 0;

        try {
          latestBlock = await timeout(web3.eth.getBlockNumber(), GET_BLOCK_NUMBER_TIMEOUT);
        } catch (err) {
          doLog(
            `[paima-funnel::readData] Exception (presumably timeout) occured while getting latest block number: ${err}`
          );
          return [];
        }

        try {
          const fromBlock = blockHeight;
          const toBlock = Math.min(latestBlock, fromBlock + blockCount - 1);

          if (toBlock >= fromBlock) {
            if (toBlock === fromBlock) {
              doLog(`q${toBlock}`);
            } else {
              doLog(`q${fromBlock}-${toBlock}`);
            }
            await internalReadDataMulti(web3, paimaL2Contract, fromBlock, toBlock)
              .then(res => (blocks = res))
              .catch(err => {
                doLog(`[paima-funnel::readData] Block reading failed: ${err}`);
              });
          } else {
            blocks = [];
          }
        } catch (err) {
          doLog(`[paima-funnel::readData] Exception occured while reading blocks: ${err}`);
          return [];
        }
        return blocks;
      },
    };
  },
};

export default paimaFunnel;
