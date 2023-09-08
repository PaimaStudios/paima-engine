import type { PoolClient } from 'pg';

import type { ChainDataExtensionDatum, ChainFunnel } from '@paima/runtime';
import { EmulatedBlocksFunnel } from './funnel';
import { DEFAULT_FUNNEL_TIMEOUT, doLog, logError, timeout } from '@paima/utils';
import type { FunnelSharedData } from '../BaseFunnel';

export async function wrapToEmulatedBlocksFunnel(
  chainFunnel: ChainFunnel,
  sharedData: FunnelSharedData,
  dbTx: PoolClient,
  startBlockHeight: number,
  emulatedBlocks: boolean,
  maxWait: number
): Promise<ChainFunnel> {
  if (!emulatedBlocks) {
    return chainFunnel;
  }

  try {
    // get the time of the block to start indexing the DC from
    const startBlock = await timeout(
      sharedData.web3.eth.getBlock(startBlockHeight),
      DEFAULT_FUNNEL_TIMEOUT
    );
    const startTimestamp =
      typeof startBlock.timestamp === 'string'
        ? parseInt(startBlock.timestamp, 10)
        : startBlock.timestamp;
    const ebp = await EmulatedBlocksFunnel.recoverState(
      sharedData,
      {
        startTimestamp,
        maxWait,
        baseFunnel: chainFunnel,
      },
      dbTx,
      startBlockHeight
    );
    return ebp;
  } catch (err) {
    doLog('[paima-funnel] Unable to initialize emulated blocks processor:');
    logError(err);
    throw new Error('[paima-funnel] Unable to initialize emulated blocks processor');
  }
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

export function calculateBoundaryTimestamp(
  startTimestamp: number,
  blockTime: number,
  blockNumber: number
): number {
  return startTimestamp + Math.floor(blockTime * blockNumber);
}

export function timestampToBlockNumber(
  startTimestamp: number,
  blockTime: number,
  timestamp: number
): number {
  return Math.floor((timestamp - startTimestamp) / blockTime);
}
