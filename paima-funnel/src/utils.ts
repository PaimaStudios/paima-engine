import type Web3 from 'web3';
import type { Pool } from 'pg';

import { DEFAULT_FUNNEL_TIMEOUT, timeout } from '@paima/utils';
import type { ChainData, ChainDataExtensionDatum, PresyncChainData } from '@paima/runtime';

import { EmulatedBlocksProcessor } from './emulated-blocks-processor';

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
  baseChainData: ChainData[],
  cdeData: PresyncChainData[]
): ChainData[] {
  return baseChainData.map(blockData => ({
    ...blockData,
    extensionDatums: cdeData.find(
      blockCdeData => blockCdeData.blockNumber === blockData.blockNumber
    )?.extensionDatums,
  }));
}

export function calculateBoundaryTimestamp(
  startTimestamp: number,
  blockTime: number,
  boundaryOffset: number
): number {
  return startTimestamp + Math.floor(blockTime * boundaryOffset);
}

export async function initializeEmulatedBlocksProcessor(
  web3: Web3,
  DBConn: Pool,
  startBlockHeight: number,
  emulatedBlocks: boolean,
  maxWait: number
): Promise<EmulatedBlocksProcessor | undefined> {
  if (!emulatedBlocks) {
    return undefined;
  }

  const startBlock = await timeout(web3.eth.getBlock(startBlockHeight), DEFAULT_FUNNEL_TIMEOUT);
  const startTimestamp =
    typeof startBlock.timestamp === 'string'
      ? parseInt(startBlock.timestamp, 10)
      : startBlock.timestamp;
  const ebp = new EmulatedBlocksProcessor(DBConn, startBlockHeight, startTimestamp, maxWait);
  return ebp;
}

export function emulateCde(
  data: ChainDataExtensionDatum[][],
  blockNumber: number
): ChainDataExtensionDatum[] {
  return data
    .flat()
    .sort((a, b) => {
      const bhDiff = a.blockNumber - b.blockNumber;
      const cdeIdDiff = a.cdeId - b.cdeId;
      return bhDiff ? bhDiff : cdeIdDiff;
    })
    .map(cdeDatum => ({ ...cdeDatum, blockNumber }));
}
