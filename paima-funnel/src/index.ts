import type Web3 from 'web3';

import {
  ENV,
  doLog,
  getPaimaL2Contract,
  initWeb3,
  validatePaimaL2ContractAddress,
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
} from './paima-l2-reading.js';
import { getAllCdeData } from './cde.js';
import { timeout } from './utils.js';
import { composeChainData, groupCdeData } from './data-processing.js';
import { instantiateExtension } from './cde-initialization.js';

const GET_BLOCK_NUMBER_TIMEOUT = 5000;

class PaimaFunnel {
  public nodeUrl: string;
  public paimaL2ContractAddress: string;
  public extensions: ChainDataExtension[];
  public web3: Web3;
  public paimaL2Contract: PaimaL2Contract;
  private instantiatedExtensions: InstantiatedChainDataExtension[];

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
    this.instantiatedExtensions = extensions.map(e => instantiateExtension(web3, e));
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

    const data = await getAllCdeData(this.web3, this.instantiatedExtensions, fromBlock, toBlock);
    const groupedData = groupCdeData(fromBlock, toBlock, data);
    return groupedData.filter(unit => unit.extensionDatums.length > 0);
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
      doLog(
        `[paima-funnel] Exception (presumably timeout) occured while getting latest block number: ${err}`
      );
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
        getAllCdeData(this.web3, this.instantiatedExtensions, blockNumber, blockNumber),
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
      const [blockResults, submittedDataBlocks, cdeData] = await Promise.all([
        getMultipleBlockData(this.web3, fromBlock, toBlock),
        getSubmittedDataMulti(this.web3, this.paimaL2Contract, fromBlock, toBlock),
        getAllCdeData(this.web3, this.instantiatedExtensions, fromBlock, toBlock),
      ]);
      return composeChainData(blockResults, submittedDataBlocks, cdeData);
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
    return new PaimaFunnel(nodeUrl, paimaL2ContractAddress, extensions, web3, paimaL2Contract);
  },
};

export default paimaFunnelInitializer;
