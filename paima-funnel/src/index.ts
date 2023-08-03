import type Web3 from 'web3';
import type { Pool } from 'pg';

import {
  ENV,
  doLog,
  getPaimaL2Contract,
  initWeb3,
  validatePaimaL2ContractAddress,
  timeout,
} from '@paima/utils';
import type { PaimaL2Contract } from '@paima/utils';
import { loadChainDataExtensions } from '@paima/runtime';
import type { ChainFunnel, ChainData, ChainDataExtension, PresyncChainData } from '@paima/runtime';

import { getBaseChainDataMulti, getBaseChainDataSingle } from './reading.js';
import { getUngroupedCdeData } from './cde/reading.js';
import { composeChainData, groupCdeData, initializeEmulatedBlocksProcessor } from './utils.js';
import type { EmulatedBlocksProcessor } from './emulated-blocks-processor.js';

const GET_BLOCK_NUMBER_TIMEOUT = 5000;

class PaimaFunnel {
  private latestAvailableBlockNumber: number;

  constructor(
    private readonly web3: Web3,
    private readonly paimaL2Contract: PaimaL2Contract,
    private readonly extensions: ChainDataExtension[],
    private readonly extensionsValid: boolean,
    private emulatedBlocksProcessor: EmulatedBlocksProcessor | undefined
  ) {
    this.latestAvailableBlockNumber = 0;
  }

  public getExtensions = (): ChainDataExtension[] => {
    return this.extensions;
  };

  public extensionsAreValid = (): boolean => {
    return this.extensionsValid;
  };

  public readData = async (
    blockHeight: number,
    blockCount: number = ENV.DEFAULT_FUNNEL_GROUP_SIZE
  ): Promise<ChainData[]> => {
    //console.log(`[funnel] called readData(${blockHeight}, ${blockCount})`);
    if (this.emulatedBlocksProcessor) {
      return await this.readEmulatedData(blockHeight, blockCount);
    } else {
      try {
        return await this.readSyncData(blockHeight, blockCount);
      } catch (err) {
        doLog(`[paima-funnel::readData] Exception occurred while reading blocks: ${err}`);
        return [];
      }
    }
  };

  public readSyncData = async (
    blockHeight: number,
    blockCount: number
  ): Promise<ChainData[]> => {
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
  };

  public readEmulatedData = async (
    blockHeight: number,
    blockCount: number
  ): Promise<ChainData[]> => {
    if (!this.emulatedBlocksProcessor) {
      throw new Error(
        '[paima-funnel] Internal error: readEmulatedData called with emulated blocks disabled'
      );
    }

    const nextBlock = await this.emulatedBlocksProcessor.getNextBlock();
    if (nextBlock) {
      return [nextBlock];
    }

    try {
      blockHeight = await this.emulatedBlocksProcessor.emulatedBlockHeightToDeployment(blockHeight);
      // errors from the previous line should stop the entire engine -- rethrow
    } catch (err) {
      doLog(`[paima-funnel::readData] Exception occurred while calculating DC blockheight: ${err}`);
      throw err;
    }
    try {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      console.log(`[funnel::readEmulatedData] fetching ${blockHeight}, ${blockCount}`);
      const fetchedData = await this.readSyncData(blockHeight, blockCount);
      const synced =
        fetchedData.length > 0
          ? fetchedData[fetchedData.length - 1].blockNumber >= this.latestAvailableBlockNumber
          : true;
      console.log(
        `[funnel::readEmulatedData] feeding @${currentTimestamp}, synced: ${synced}, data length: ${fetchedData.length}`
      );
      await this.emulatedBlocksProcessor.feedData(currentTimestamp, fetchedData, synced);
      const nextBlock = await this.emulatedBlocksProcessor.getNextBlock();
      if (nextBlock) {
        console.log(`[funnel::readEmulatedData] gotBlock #${nextBlock.blockNumber}`);
      }
      return nextBlock ? [nextBlock] : [];
    } catch (err) {
      doLog(`[paima-funnel::readData] Exception occurred while reading blocks: ${err}`);
      return [];
    }
  };

  public readPresyncData = async (
    fromBlock: number,
    toBlock: number
  ): Promise<PresyncChainData[]> => {
    try {
      toBlock = Math.min(toBlock, ENV.START_BLOCKHEIGHT);
      fromBlock = Math.max(fromBlock, 0);
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
    } catch (err) {
      doLog(`[paima-funnel::readPresyncData] Exception occurred while reading blocks: ${err}`);
      return [];
    }
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

      this.latestAvailableBlockNumber = latestBlock;

      const fromBlock = Math.max(0, firstBlockHeight);
      const toBlock = Math.min(latestBlock, firstBlockHeight + blockCount - 1);

      if (fromBlock <= toBlock) {
        return [fromBlock, toBlock];
      } else {
        return ERR_RESULT;
      }
    } catch (err) {
      doLog(`[paima-funnel] Exception occurred while getting latest block number: ${err}`);
      return ERR_RESULT;
    }
  };

  private internalReadDataSingle = async (blockNumber: number): Promise<ChainData[]> => {
    if (blockNumber < 0) {
      return [];
    }
    try {
      const [baseChainData, cdeData] = await Promise.all([
        getBaseChainDataSingle(this.web3, this.paimaL2Contract, blockNumber),
        getUngroupedCdeData(this.web3, this.extensions, blockNumber, blockNumber),
      ]);

      return [
        {
          ...baseChainData,
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
      const [baseChainData, ungroupedCdeData] = await Promise.all([
        getBaseChainDataMulti(this.web3, this.paimaL2Contract, fromBlock, toBlock),
        getUngroupedCdeData(this.web3, this.extensions, fromBlock, toBlock),
      ]);
      const cdeData = groupCdeData(fromBlock, toBlock, ungroupedCdeData);
      return composeChainData(baseChainData, cdeData);
    } catch (err) {
      doLog(`[funnel] at ${fromBlock}-${toBlock} caught ${err}`);
      throw err;
    }
  };
}

const paimaFunnelInitializer = {
  async initialize(
    nodeUrl: string,
    paimaL2ContractAddress: string,
    DBConn: Pool
  ): Promise<ChainFunnel> {
    validatePaimaL2ContractAddress(paimaL2ContractAddress);
    const web3 = await initWeb3(nodeUrl);
    const paimaL2Contract = getPaimaL2Contract(paimaL2ContractAddress, web3);
    const [extensions, extensionsValid] = await loadChainDataExtensions(web3, ENV.CDE_CONFIG_PATH);
    const emulatedBlocksProcessor = await initializeEmulatedBlocksProcessor(
      web3,
      DBConn,
      ENV.START_BLOCKHEIGHT,
      ENV.EMULATED_BLOCKS,
      ENV.EMULATED_BLOCKS_MAX_WAIT
    );
    return new PaimaFunnel(
      web3,
      paimaL2Contract,
      extensions,
      extensionsValid,
      emulatedBlocksProcessor
    );
  },
};

export default paimaFunnelInitializer;
