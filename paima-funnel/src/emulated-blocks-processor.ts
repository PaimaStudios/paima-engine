import type { Pool } from 'pg';

import Prando from '@paima/prando';
import type { ChainData } from '@paima/runtime';
import { ENV } from '@paima/utils';
import {
  emulatedSelectLatestPrior,
  emulatedStoreBlockHeight,
  getBlockHeight,
  getLatestProcessedBlockHeight,
} from '@paima/db';
import { hashTogether } from '@paima/utils-backend';

import { calculateBoundaryTimestamp, emulateCde } from './utils';

// NOTE: the funnel assumes that all ChainData coming out of it are successfully processed by the SM and won't need to be fetched again

export class EmulatedBlocksProcessor {
  private latestEmulatedBlockNumber: number;
  private latestFetchedBlockNumber: number;
  private latestFetchedTimestamp: number;
  private certaintyThreshold: number;
  private processingQueue: ChainData[];

  constructor(
    private readonly DBConn: Pool,
    private readonly startBlockHeight: number,
    private readonly startTimestamp: number,
    private readonly maxWait: number
  ) {
    this.latestEmulatedBlockNumber = 0;
    this.latestFetchedBlockNumber = startBlockHeight - 1;
    this.latestFetchedTimestamp = startTimestamp;
    this.certaintyThreshold = startTimestamp - 1;
    this.processingQueue = [];
  }

  public emulatedBlockHeightToDeployment = async (emulatedBlockHeight: number): Promise<number> => {
    if (emulatedBlockHeight != this.latestEmulatedBlockNumber + 1) {
      const result = await emulatedSelectLatestPrior.run(
        { emulated_block_height: emulatedBlockHeight },
        this.DBConn
      );
      if (result.length === 0) {
        throw new Error(
          `[EBP] Unexpected EBH ${emulatedBlockHeight} after latest ${this.latestEmulatedBlockNumber} with no data in DB to fall back on`
        );
      }
      return result[0].deployment_chain_block_height + 1;
    }

    return this.latestFetchedBlockNumber + 1;
  };

  public feedData = async (
    currentTimestamp: number,
    fetchedBlocks: ChainData[],
    synced: boolean
  ): Promise<void> => {
    if (fetchedBlocks.length > 0) {
      this.validateFetchedBlocks(fetchedBlocks);
      this.processingQueue.push(...fetchedBlocks);

      const latestBlock = fetchedBlocks[fetchedBlocks.length - 1];
      this.latestFetchedBlockNumber = latestBlock.blockNumber;
      this.latestFetchedTimestamp = latestBlock.timestamp;
    }

    const latestTimestamp = this.latestFetchedTimestamp;
    const awaitedThreshold = currentTimestamp - this.maxWait;
    this.certaintyThreshold = synced
      ? Math.max(latestTimestamp, awaitedThreshold)
      : latestTimestamp;
  };

  public recoverStateFromDatabase = async (): Promise<void> => {
    const [b] = await getLatestProcessedBlockHeight.run(undefined, this.DBConn);
    if (!b) {
      return;
    }

    const blockHeight = b.block_height;
    const [res] = await emulatedSelectLatestPrior.run(
      { emulated_block_height: blockHeight },
      this.DBConn
    );
    if (!res) {
      throw new Error(`[funnel] Invalid DB state to recover emulated block state!`);
    }

    this.latestEmulatedBlockNumber = res.emulated_block_height;
    this.latestFetchedBlockNumber = res.deployment_chain_block_height;
    this.latestFetchedTimestamp = parseInt(res.second_timestamp, 10);
  };

  public getNextBlock = async (): Promise<ChainData | undefined> => {
    const blockNumber = this.latestEmulatedBlockNumber + 1;
    const endTimestamp = calculateBoundaryTimestamp(
      this.startTimestamp,
      ENV.BLOCK_TIME,
      blockNumber
    );
    if (endTimestamp >= this.certaintyThreshold) {
      return undefined;
    }

    const timestamp = calculateBoundaryTimestamp(
      this.startTimestamp,
      ENV.BLOCK_TIME,
      blockNumber - 1
    );
    this.latestEmulatedBlockNumber = blockNumber;

    const mergedBlocks: ChainData[] = [];
    while (this.processingQueue.length > 0 && this.processingQueue[0].timestamp < endTimestamp) {
      const block = this.processingQueue.shift();
      if (block) {
        mergedBlocks.push(block);
      }
    }

    const blockHash = await this.calculateHash(mergedBlocks, blockNumber);
    const submittedData = mergedBlocks.map(block => block.submittedData).flat();
    const extensionDatums = emulateCde(
      mergedBlocks.map(block => (block.extensionDatums ?? [])),
      blockNumber
    );

    for (const block of mergedBlocks) {
      await emulatedStoreBlockHeight.run(
        {
          deployment_chain_block_height: block.blockNumber,
          second_timestamp: block.timestamp.toString(10),
          emulated_block_height: blockNumber,
        },
        this.DBConn
      );
    }

    return {
      blockNumber,
      blockHash,
      timestamp,
      submittedData,
      extensionDatums,
    };
  };

  private validateFetchedBlocks = (fetchedBlocks: ChainData[]): void => {
    let latestTimestamp = this.latestFetchedTimestamp;
    let latestBlockNumber = this.latestFetchedBlockNumber;
    for (const block of fetchedBlocks) {
      if (block.timestamp < latestTimestamp) {
        throw new Error(`Unexpected timestamp ${block.timestamp} in block ${block.blockNumber}`);
      }
      latestTimestamp = block.timestamp;
      if (block.blockNumber != latestBlockNumber + 1) {
        throw new Error(
          `Unexpected block number ${block.blockNumber} after block ${latestBlockNumber}`
        );
      }
      latestBlockNumber = block.blockNumber;
    }
  };

  private calculateHash = async (
    mergedBlocks: ChainData[],
    blockNumber: number
  ): Promise<string> => {
    if (mergedBlocks.length > 0) {
      return hashTogether(mergedBlocks.map(b => b.blockHash));
    }

    // No blocks on deployment chain, backup hash calculation:

    // NOTE: for the following to work, all of the prior emulated blocks must have already been processed by SM
    // -- in particular, their corresponding seeds must have been calculated and stored in the DB.
    // For this reason, the emulated blocks processor is designed to return one block at a time.

    if (blockNumber <= 1) {
      throw new Error(`No blocks or prior seeds, unable to generate block hash!`);
    }
    const [prevSeed] = await getBlockHeight.run({ block_height: blockNumber - 1 }, this.DBConn);
    if (!prevSeed) {
      throw new Error(`Unable to get seed for blockheight ${blockNumber - 1}`);
    }
    const prandoSeed = hashTogether([blockNumber.toString(10), prevSeed.seed]);
    const rng = new Prando(prandoSeed);

    const [latestBlock] = await getLatestProcessedBlockHeight.run(undefined, this.DBConn);
    if (!latestBlock) {
      throw new Error(`Unable to retrieve the latest block to generate block hash!`);
    }
    const maxBlockHeight = latestBlock.block_height;
    const randomPriorHashes: string[] = [];
    for (let i = 0; i < 20; i++) {
      const blockHeight = rng.nextInt(1, maxBlockHeight);
      const [b] = await getBlockHeight.run({ block_height: blockHeight }, this.DBConn);
      if (!b) {
        throw new Error(`Unable to get seed for blockheight ${blockHeight}`);
      }
      randomPriorHashes.push(b.seed);
    }
    return hashTogether(randomPriorHashes);
  };
}
