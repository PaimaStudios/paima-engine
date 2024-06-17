import type { ChainData, ChainDataExtensionDatum, EvmPresyncChainData } from '@paima/sm';
import type { InternalEventType } from '@paima/utils';
import { ConfigNetworkType, doLog } from '@paima/utils';

export function groupCdeData(
  network: string,
  fromBlock: number,
  toBlock: number,
  data: ChainDataExtensionDatum[][]
): EvmPresyncChainData[] {
  const result: EvmPresyncChainData[] = [];
  for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber++) {
    const extensionDatums: ChainDataExtensionDatum[] = [];
    for (const dataStream of data) {
      while (dataStream.length > 0 && dataStream[0].blockNumber === blockNumber) {
        const datum = dataStream.shift();
        if (datum) {
          extensionDatums.push(datum);
        }
      }
    }
    result.push({
      blockNumber,
      extensionDatums,
      network,
      networkType: ConfigNetworkType.EVM,
    });
  }
  return result;
}

export function composeChainData(
  baseChainData: ChainData[],
  cdeData: EvmPresyncChainData[]
): ChainData[] {
  return baseChainData.map(blockData => {
    const matchingData = cdeData.find(
      blockCdeData => blockCdeData.blockNumber === blockData.blockNumber
    );

    if (!matchingData) {
      return blockData;
    }

    if (blockData.extensionDatums) {
      if (matchingData.extensionDatums) {
        blockData.extensionDatums.push(...matchingData.extensionDatums);
      }
    } else if (matchingData.extensionDatums) {
      blockData.extensionDatums = matchingData.extensionDatums;
    }

    if (blockData.internalEvents) {
      if (matchingData.internalEvents) {
        blockData.internalEvents.push(...matchingData.internalEvents);
      }
    } else if (matchingData.internalEvents) {
      blockData.internalEvents = matchingData.internalEvents;
    }

    return blockData;
  });
}

/*
 * performs binary search to find the block corresponding to a specific timestamp
 * Note: if there are multiple blocks with the same timestamp
 * @returns the index of the first block that occurs > targetTimestamp
 */
export async function findBlockByTimestamp(
  low: number,
  high: number,
  targetTimestamp: number,
  chainName: string,
  getTimestampForBlock: (at: number) => Promise<number>
): Promise<number> {
  let requests = 0;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);

    const ts = await getTimestampForBlock(mid);

    requests++;

    // recall: there may be many blocks with the same targetTimestamp
    // in this case, <= means we slowly increase `low` to return the most recent block with that timestamp
    if (ts <= targetTimestamp) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  doLog(`Found block #${low} on ${chainName} by binary search with ${requests} requests`);

  return low;
}

// deterministically assigns to every block in blockData, a block in chainData.
// this is the block that is used for the data merge.
// additionally returns the inverse mapping.
export function buildParallelBlockMappings(
  applyDelay: (ts: number) => number,
  chainData: ChainData[],
  blockData: [number, { blockNumber: number }][]
): {
  parallelToMainchainBlockHeightMapping: { [blockNumber: number]: number };
  mainchainToParallelBlockHeightMapping: { [blockNumber: number]: number };
} {
  const parallelToMainchainBlockHeightMapping: { [blockNumber: number]: number } = {};
  const mainchainToParallelBlockHeightMapping: { [blockNumber: number]: number } = {};

  let currIndex = 0;

  for (const block of blockData) {
    while (currIndex < chainData.length) {
      if (applyDelay(chainData[currIndex].timestamp) >= block[0]) {
        parallelToMainchainBlockHeightMapping[block[1].blockNumber] =
          chainData[currIndex].blockNumber;

        mainchainToParallelBlockHeightMapping[chainData[currIndex].blockNumber] =
          block[1].blockNumber;
        break;
      } else {
        currIndex++;
      }
    }
  }

  return {
    parallelToMainchainBlockHeightMapping: parallelToMainchainBlockHeightMapping,
    mainchainToParallelBlockHeightMapping: mainchainToParallelBlockHeightMapping,
  };
}

// This adds the internal event that updates the last block point. This is
// mostly to avoid having to do a binary search each time we boot the
// engine. Since we need to know from where to start searching for blocks in
// the timestamp range.
export function addInternalCheckpointingEvent(
  chainData: ChainData[],
  mapBlockNumber: (mainchainNumber: number) => number,
  chainName: string,
  // FIXME: not really clear why this ignore is needed
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  eventType: InternalEventType.EvmLastBlock | InternalEventType.AvailLastBlock
): void {
  for (const data of chainData) {
    const originalBlockNumber = mapBlockNumber(data.blockNumber);
    // it's technically possible for this to be null, because there may not be
    // a block of the sidechain in between a particular pair of blocks or the
    // original chain.
    //
    // in this case it could be more optimal to set the block number here to
    // the one in the next block, but it shouldn't make much of a difference.
    if (!originalBlockNumber) {
      continue;
    }

    if (!data.internalEvents) {
      data.internalEvents = [];
    }
    data.internalEvents.push({
      type: eventType,
      // this is the block number in the original chain, so that we can resume
      // from that point later.
      //
      // there can be more than one block here, for example, if the main
      // chain produces a block every 10 seconds, and the parallel chain
      // generates a block every second, then there can be 10 blocks.
      // The block here will be the last in the range. Losing the
      // information doesn't matter because there is a transaction per main
      // chain block, so the result would be the same.
      block: originalBlockNumber,
      network: chainName,
    });
  }
}

// finds the last block in the timestampToBlockNumber collection that is between
// the range: (-Infinity, maxTimestamp]
// PRE: timestampToBlockNumber should be sorted by timestamp (first element of the tuple)
export function getUpperBoundBlock(
  timestampToBlockNumber: [number, number][],
  maxTimestamp: number
): number | undefined {
  let toBlock: number | undefined = undefined;

  for (let i = timestampToBlockNumber.length - 1; i >= 0; i--) {
    const [ts, toBlockInner] = timestampToBlockNumber[i];

    if (maxTimestamp >= ts) {
      toBlock = toBlockInner;
      // we are going backwards, so we can stop
      break;
    }
  }

  return toBlock;
}
