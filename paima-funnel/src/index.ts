import { doLog, getStorageContract, initWeb3, validateStorageAddress } from '@paima/utils';

import type { ChainFunnel, ChainData, ChainDataExtension } from '@paima/utils';

import { internalReadDataMulti, timeout } from './reading.js';

const DEFAULT_BLOCK_COUNT = 100;
const GET_BLOCK_NUMBER_TIMEOUT = 5000;

// TODO: paimaFunnel here does not correspond to any type definition
const paimaFunnel = {
  async initialize(nodeUrl: string, storageAddress: string): Promise<ChainFunnel> {
    validateStorageAddress(storageAddress);
    const web3 = await initWeb3(nodeUrl);
    const storage = getStorageContract(storageAddress, web3);
    return {
      nodeUrl,
      storageAddress,
      extensions: [] as ChainDataExtension[],
      web3,
      storage,
      async readData(
        blockHeight: number,
        blockCount: number = DEFAULT_BLOCK_COUNT
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
            await internalReadDataMulti(web3, storage, fromBlock, toBlock)
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
