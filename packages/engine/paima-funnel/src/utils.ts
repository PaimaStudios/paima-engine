import type { ChainData, ChainDataExtensionDatum, EvmPresyncChainData } from '@paima/sm';
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
