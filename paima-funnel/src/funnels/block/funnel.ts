import { ENV, doLog, timeout } from '@paima/utils';
import type { ChainData, ChainFunnel } from '@paima/runtime';
import { getBaseChainDataMulti, getBaseChainDataSingle } from '../../reading';
import { getUngroupedCdeData } from '../../cde/reading';
import { composeChainData, groupCdeData } from '../../utils';
import { BaseFunnel } from '../BaseFunnel';

const GET_BLOCK_NUMBER_TIMEOUT = 5000;

export class BlockFunnel extends BaseFunnel implements ChainFunnel {
  public override readData = async (blockHeight: number): Promise<ChainData[]> => {
    const [fromBlock, toBlock] = await this.adjustBlockHeightRange(
      blockHeight,
      ENV.DEFAULT_FUNNEL_GROUP_SIZE
    );

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

  /**
   * Will return [-1, -2] if the range is determined to be empty.
   * It should be enough to check that fromBlock >= 0,
   * but this will also fail a fromBlock <= toBlock check.
   */
  private adjustBlockHeightRange = async (
    firstBlockHeight: number,
    blockCount: number
  ): Promise<[number, number]> => {
    const ERR_RESULT: [number, number] = [-1, -2];

    const latestBlock: number = await timeout(
      this.sharedData.web3.eth.getBlockNumber(),
      GET_BLOCK_NUMBER_TIMEOUT
    );

    this.sharedData.latestAvailableBlockNumber = latestBlock;

    const fromBlock = Math.max(0, firstBlockHeight);
    const toBlock = Math.min(latestBlock, firstBlockHeight + blockCount - 1);

    if (fromBlock <= toBlock) {
      return [fromBlock, toBlock];
    } else {
      return ERR_RESULT;
    }
  };

  private internalReadDataSingle = async (blockNumber: number): Promise<ChainData[]> => {
    if (blockNumber < 0) {
      return [];
    }
    try {
      const [baseChainData, cdeData] = await Promise.all([
        getBaseChainDataSingle(this.sharedData.web3, this.sharedData.paimaL2Contract, blockNumber),
        getUngroupedCdeData(
          this.sharedData.web3,
          this.sharedData.extensions,
          blockNumber,
          blockNumber
        ),
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
        getBaseChainDataMulti(
          this.sharedData.web3,
          this.sharedData.paimaL2Contract,
          fromBlock,
          toBlock
        ),
        getUngroupedCdeData(this.sharedData.web3, this.sharedData.extensions, fromBlock, toBlock),
      ]);
      const cdeData = groupCdeData(fromBlock, toBlock, ungroupedCdeData);
      return composeChainData(baseChainData, cdeData);
    } catch (err) {
      doLog(`[funnel] at ${fromBlock}-${toBlock} caught ${err}`);
      throw err;
    }
  };
}
