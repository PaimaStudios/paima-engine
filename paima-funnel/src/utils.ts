import type {
  BlockData,
  BlockSubmittedData,
  ChainData,
  ChainDataExtensionDatum,
  PresyncChainData,
} from '@paima/utils-backend';

export function groupCdeData(
  fromBlock: number,
  toBlock: number,
  data: ChainDataExtensionDatum[][]
): PresyncChainData[] {
  const result: PresyncChainData[] = [];
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
    });
  }
  return result;
}

export function composeChainData(
  cutBlockData: BlockData[],
  submittedDataBlocks: BlockSubmittedData[],
  cdeData: PresyncChainData[]
): ChainData[] {
  const length = Math.min(cutBlockData.length, submittedDataBlocks.length, cdeData.length);
  if (length === 0) {
    return [];
  }
  cutBlockData = cutBlockData.slice(0, length);
  submittedDataBlocks = submittedDataBlocks.slice(0, length);
  cdeData = cdeData.slice(0, length);

  return cutBlockData.map((blockData, index) => ({
    ...blockData,
    submittedData: submittedDataBlocks[index].submittedData,
    extensionDatums: cdeData[index].extensionDatums,
  }));
}
