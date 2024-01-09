import type { ChainData, ChainDataExtensionDatum, EvmPresyncChainData } from '@paima/sm';
import { ConfigNetworkType } from '@paima/utils';

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
