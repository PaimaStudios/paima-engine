import type Web3 from 'web3';

import {
  ENV,
  doLog,
  getPaimaL2Contract,
  initWeb3,
  validatePaimaL2ContractAddress,
  timeout,
} from '@paima/utils';
import type {
  ChainFunnel,
  ChainData,
  ChainDataExtension,
  InstantiatedChainDataExtension,
  PaimaL2Contract,
  PresyncChainData,
} from '@paima/utils';
import { loadChainDataExtensions } from '@paima/utils-backend';

import {
  getBlockData,
  getMultipleBlockData,
  getSubmittedDataMulti,
  getSubmittedDataSingle,
} from './reading.js';
import { getUngroupedCdeData } from './cde.js';
import { composeChainData, groupCdeData } from './utils.js';
import { instantiateExtension } from './cde-initialization.js';

const GET_BLOCK_NUMBER_TIMEOUT = 5000;

class PaimaFunnel {
  private extensions: InstantiatedChainDataExtension[];
  private web3: Web3;
  private paimaL2Contract: PaimaL2Contract;

  constructor(
    web3: Web3,
    paimaL2Contract: PaimaL2Contract,
    extensions: InstantiatedChainDataExtension[]
  ) {
    this.extensions = extensions;
    this.web3 = web3;
    this.paimaL2Contract = paimaL2Contract;
  }

  public getExtensions = (): ChainDataExtension[] => {
    return this.extensions;
  };

  public readData = async (
    blockHeight: number,
    blockCount: number = ENV.DEFAULT_FUNNEL_GROUP_SIZE
  ): Promise<ChainData[]> => {
    try {
      const [fromBlock, toBlock] = await this.adjustBlockHeightRange(blockHeight, blockCount);

      if (fromBlock < 0 || toBlock < fromBlock) {
        return [];
      }

      if (toBlock === fromBlock) {
        doLog(`#${toBlock}`);
        return await this.internalReadDataSingle(fromBlock);
      } else {
        doLog(`#${fromBlock}-${toBlock}`);
        return await this.internalReadDataMulti(fromBlock, toBlock);
      }
    } catch (err) {
      doLog(`[paima-funnel::readData] Exception occurred while reading blocks: ${err}`);
      return [];
    }
  };

  public readPresyncData = async (
    fromBlock: number,
    toBlock: number
  ): Promise<PresyncChainData[]> => {
    if (toBlock > ENV.START_BLOCKHEIGHT) {
      toBlock = ENV.START_BLOCKHEIGHT;
    }
    if (fromBlock > toBlock) {
      return [];
    }

    const ungroupedCdeData = await getUngroupedCdeData(
      this.web3,
      this.extensions,
      fromBlock,
      toBlock
    );
    return groupCdeData(fromBlock, toBlock, ungroupedCdeData);
  };

  // Will return [-1, -2] if the range is determined to be empty.
  // It should be enough to check that fromBlock >= 0,
  // but this will also fail a fromBlock <= toBlock check.
  private adjustBlockHeightRange = async (
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
      doLog(`[paima-funnel] Exception occured while getting latest block number: ${err}`);
      return ERR_RESULT;
    }
  };

  private internalReadDataSingle = async (blockNumber: number): Promise<ChainData[]> => {
    if (blockNumber < 0) {
      return [];
    }
    try {
      const [blockData, submittedData, cdeData] = await Promise.all([
        getBlockData(this.web3, blockNumber),
        getSubmittedDataSingle(this.web3, this.paimaL2Contract, blockNumber),
        getUngroupedCdeData(this.web3, this.extensions, blockNumber, blockNumber),
      ]);

      return [
        {
          ...blockData,
          submittedData,
          extensionDatums: cdeData.flat(),
        },
      ];
    } catch (err) {
      doLog(`[funnel] at ${blockNumber} caught ${err}`);
      throw err;
    }
  };

  private internalReadDataMulti = async (
    fromBlock: number,
    toBlock: number
  ): Promise<ChainData[]> => {
    if (toBlock < fromBlock || fromBlock < 0) {
      return [];
    }
    try {
      const [blockData, submittedData, ungroupedCdeData] = await Promise.all([
        getMultipleBlockData(this.web3, fromBlock, toBlock),
        getSubmittedDataMulti(this.web3, this.paimaL2Contract, fromBlock, toBlock),
        getUngroupedCdeData(this.web3, this.extensions, fromBlock, toBlock),
      ]);
      const cdeData = groupCdeData(fromBlock, toBlock, ungroupedCdeData);
      return composeChainData(blockData, submittedData, cdeData);
    } catch (err) {
      doLog(`[funnel] at ${fromBlock}-${toBlock} caught ${err}`);
      throw err;
    }
  };
}

const paimaFunnelInitializer = {
  async initialize(nodeUrl: string, paimaL2ContractAddress: string): Promise<ChainFunnel> {
    validatePaimaL2ContractAddress(paimaL2ContractAddress);
    const web3 = await initWeb3(nodeUrl);
    const paimaL2Contract = getPaimaL2Contract(paimaL2ContractAddress, web3);
    const extensions = await loadChainDataExtensions(ENV.CDE_CONFIG_PATH);
    const instantiatedExtensions = extensions.map(e => instantiateExtension(web3, e));
    return new PaimaFunnel(web3, paimaL2Contract, instantiatedExtensions);
  },
};

export default paimaFunnelInitializer;
