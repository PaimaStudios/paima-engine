import { doLog, getStorageContract, initWeb3, validateStorageAddress } from '@paima/utils';

import type { ChainFunnel, ChainData, ChainDataExtension } from '@paima/utils';

import { internalReadDataMulti, timeout } from './reading.js';

const DEFAULT_BLOCK_COUNT = 100;

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
        try {
          const latestBlock = await timeout(web3.eth.getBlockNumber(), 3000);
          let fromBlock = blockHeight;
          let toBlock = Math.min(latestBlock, fromBlock + blockCount - 1);

          if (toBlock >= fromBlock) {
            doLog(`[Paima Funnel] reading blocks from #${fromBlock} to #${toBlock}`);
            await internalReadDataMulti(web3, storage, fromBlock, toBlock)
              .then(res => (blocks = res))
              .catch(err => {
                doLog(`[paima-funnel::readData] Block reading failed: ${err}`);
              });
          } else {
            if (blockCount > 0) {
              doLog(`[PaimaFunnel] skipping reading, no new blocks ready`);
            }
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
