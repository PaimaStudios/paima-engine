import type { Pool } from 'pg';

import Prando from '@paima/prando';
import type { ChainData, ChainFunnel } from '@paima/runtime';
import { ENV, doLog } from '@paima/utils';
import {
  emulatedSelectLatestPrior,
  upsertEmulatedBlockheight,
  getBlockHeight,
  getLatestProcessedBlockHeight,
} from '@paima/db';
import { hashTogether } from '@paima/utils-backend';

import { calculateBoundaryTimestamp, emulateCde } from './utils';
import { BaseFunnel } from '../BaseFunnel';
import type { FunnelSharedData } from '../BaseFunnel';

export class EmulatedBlocksFunnel extends BaseFunnel implements ChainFunnel {
  private dcState: {
    /** Block number of the underlying DC */
    latestFetchedBlockNumber: number;
    /** Timestamp of the latest block of the underlying DC */
    latestFetchedTimestamp: number;
  };
  private emulatedState: {
    /** Block height (not timestamp) representing the latest emulated block */
    latestEmulatedBlockNumber: number;
    /** The lower bound of any timestamp the funnel will accept */
    timestampLowerBound: number;
  };
  /** Blocks queued to be added into the current batch */
  private processingQueue: ChainData[];

  constructor(
    private readonly baseFunnel: ChainFunnel,
    sharedData: FunnelSharedData,
    private readonly DBConn: Pool,
    private readonly startBlockHeight: number,
    private readonly startTimestamp: number,
    /** Max amount of time (in seconds) to wait to close a time interval and create an emulated block */
    private readonly maxWait: number
  ) {
    super(sharedData);
    this.dcState = {
      latestFetchedBlockNumber: startBlockHeight - 1,
      latestFetchedTimestamp: startTimestamp,
    };
    this.emulatedState = {
      latestEmulatedBlockNumber: 0,
      // theoretically, any value <= startTimestamp should work
      timestampLowerBound: startTimestamp - 1,
    };
    this.processingQueue = [];
  }

  /**
   * Recall: for emulated blocks, this is called with blockHeight 1 for the initial sync
   */
  public override readData = async (blockHeight: number): Promise<ChainData[]> => {
    // EmulatedBlocksFunnel only supports syncing blocks sequentially (no arbitrary reads)
    if (blockHeight != this.emulatedState.latestEmulatedBlockNumber + 1) {
      throw new Error(
        `[EBP] Unexpected EBH ${blockHeight} after latest ${this.emulatedState.latestEmulatedBlockNumber} with no data in DB to fall back on`
      );
    }

    // 1) Check if time interval is complete. If yes, return the emulated block
    const nextBlock = await this.getNextBlock();
    if (nextBlock) {
      return [nextBlock];
    }

    // 2) If time interval is not complete, queue any new DC block that might have been made
    try {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const fetchedData = await this.baseFunnel.readData(this.dcState.latestFetchedBlockNumber + 1);

      // check if the chunk we read matches the latest block known by the RPC endpoint
      // or if there are no blocks left to fetch as we're already at the tip
      const synced =
        fetchedData.length > 0
          ? fetchedData[fetchedData.length - 1].blockNumber >=
            this.sharedData.latestAvailableBlockNumber
          : true;

      await this.feedData(currentTimestamp, fetchedData, synced);
    } catch (err) {
      doLog(`[paima-funnel::readData] Exception occurred while reading blocks: ${err}`);
      return [];
    }

    // 3) See if syncing the DC chains allows us to close out this emulated block
    //    This happens if we find a DC block whose timestamp occurs after the end of this range
    try {
      const nextBlock = await this.getNextBlock();
      // errors from the above could mean invalid state, but also simply DB error
      return nextBlock ? [nextBlock] : [];
    } catch (err) {
      doLog(`[paima-funnel::readData] Exception occurred while building next block: ${err}`);
      return [];
    }
  };

  /**
   * Validate and prepare the next batch of deployment chain blocks for processing
   *
   * @param currentTimestamp -- timestamp in seconds at the time of fetching the blocks
   * @param fetchedBlocks
   * @param synced -- true if the game node state has caught up with the latest deployment chain state
   */
  public feedData = async (
    currentTimestamp: number,
    fetchedBlocks: ChainData[],
    synced: boolean
  ): Promise<void> => {
    if (fetchedBlocks.length > 0) {
      this.validateFetchedBlocks(fetchedBlocks);
      this.processingQueue.push(...fetchedBlocks);

      const latestBlock = fetchedBlocks[fetchedBlocks.length - 1];
      this.dcState.latestFetchedBlockNumber = latestBlock.blockNumber;
      this.dcState.latestFetchedTimestamp = latestBlock.timestamp;
    }

    const latestTimestamp = this.dcState.latestFetchedTimestamp;

    // increase the lower-bound slowly as time passes, and skip forward if we see a new block
    // Note: we only take maxWait into account if we've already fully synced the chain
    //       otherwise, currentTimestamp would always be too high for historical blocks
    // Note: this only runs AFTER the underlying funnel has successfully completed
    //       that means timestampLowerBound does not change if the underlying funnel threw an error (such as an RPC error)
    const awaitedThreshold = currentTimestamp - this.maxWait;
    this.emulatedState.timestampLowerBound = synced
      ? Math.max(latestTimestamp, awaitedThreshold)
      : latestTimestamp;
  };

  public override recoverState = async (): Promise<void> => {
    await this.baseFunnel.recoverState();
    await super.recoverState();
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

    this.dcState = {
      latestFetchedBlockNumber: res.deployment_chain_block_height,
      latestFetchedTimestamp: parseInt(res.second_timestamp, 10),
    };
    this.emulatedState = {
      latestEmulatedBlockNumber: res.emulated_block_height,
      timestampLowerBound: this.dcState.latestFetchedTimestamp,
    };
  };

  /**
   * Process the deployment chain blocks waiting in the processing queue and return
   * the next emulated block, if it can already be constructed.
   *
   * @returns the next emulated block if possible, `undefined` otherwise (if deployment chain data not yet available)
   */
  public getNextBlock = async (): Promise<ChainData | undefined> => {
    const nextBlockBlockNumber = this.emulatedState.latestEmulatedBlockNumber + 1;
    const nextBlockEndTimestamp = calculateBoundaryTimestamp(
      this.startTimestamp,
      ENV.BLOCK_TIME,
      nextBlockBlockNumber
    );
    // this will be false in two cases:
    // 1. timestampLowerBound gets updated by a new block that is after nextBlockEndTimestamp
    //    so we know for sure there won't be a new block for this interval
    // 2. (currentTimestamp - this.maxWait) has exceeded the end of the interval
    //    so we assume no other block will come in
    if (nextBlockEndTimestamp >= this.emulatedState.timestampLowerBound) {
      return undefined;
    }

    const nextBlockStartTimestamp = calculateBoundaryTimestamp(
      this.startTimestamp,
      ENV.BLOCK_TIME,
      nextBlockBlockNumber - 1
    );
    this.emulatedState.latestEmulatedBlockNumber = nextBlockBlockNumber;

    // we only want to pop off the queue the entries that correspond for the next ChainData
    // for the rest, we leave them in the queue to be fetched in the next readData call
    const mergedBlocks: ChainData[] = [];
    while (
      this.processingQueue.length > 0 &&
      this.processingQueue[0].timestamp < nextBlockEndTimestamp
    ) {
      const block = this.processingQueue.shift();
      if (block) {
        if (block.timestamp < nextBlockStartTimestamp) {
          throw new Error(
            `[funnel] DC block #${block.blockNumber} with timestamp ${block.timestamp} found out of order (EB timestamp ${nextBlockStartTimestamp}). Please resync your game node from the latest snapshot.`
          );
        }
        mergedBlocks.push(block);
      }
    }

    const nextBlockBlockHash = await this.calculateHash(mergedBlocks, nextBlockBlockNumber);
    const nextBlockSubmittedData = mergedBlocks.map(block => block.submittedData).flat();
    const nextBlockExtensionDatums = emulateCde(
      mergedBlocks.map(block => block.extensionDatums ?? []),
      nextBlockBlockNumber
    );

    if (mergedBlocks.length > 0) {
      const emulatedBlockheights = mergedBlocks.map(block => ({
        deployment_chain_block_height: block.blockNumber,
        second_timestamp: block.timestamp.toString(10),
        emulated_block_height: nextBlockBlockNumber,
      }));
      const params = { items: emulatedBlockheights };
      await upsertEmulatedBlockheight.run(params, this.DBConn);
    }

    return {
      blockNumber: nextBlockBlockNumber,
      blockHash: nextBlockBlockHash,
      timestamp: nextBlockEndTimestamp,
      submittedData: nextBlockSubmittedData,
      extensionDatums: nextBlockExtensionDatums,
    };
  };

  /**
   * Check that all blocks are:
   * 1. In correct timestamp order
   * 2. In correct block number order
   */
  private validateFetchedBlocks = (fetchedBlocks: ChainData[]): void => {
    let latestTimestamp = this.dcState.latestFetchedTimestamp;
    let latestBlockNumber = this.dcState.latestFetchedBlockNumber;
    for (const block of fetchedBlocks) {
      // note: don't check for timestamp equality
      //       as some chains like Arbitrum have multiple blocks with the same timestamp
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
