import { wait } from '@paima/utils';
import { PaimaEventSystemParser } from './system-events.js';

export enum PaimaEventBrokerNames {
  PaimaEngine = 'paima-engine',
  Batcher = 'batcher',
}

/*
 * Helper to wait when batcher hash is processed by the STF
 */
export async function awaitBlock(data: { hash: string } | { blockHeight: number}, maxTimeSec = 20): Promise<number> {
  const startTime = new Date().getTime();
  const checkTime = (): boolean => startTime + maxTimeSec * 1000 > new Date().getTime();

  if ('blockHeight' in data ) {
    while (PaimaEventSystemParser.lastSTFBlock < data.blockHeight) {
      if (!checkTime) throw new Error('Block not processed');
      await wait(100);
    }
    return PaimaEventSystemParser.lastSTFBlock;
  } else if ('hash' in data) {
    while (!PaimaEventSystemParser.hashes[data.hash]) {
      if (!checkTime) throw new Error('Block not processed');
      await wait(100);
    }
    return await awaitBlock({
      blockHeight: PaimaEventSystemParser.hashes[data.hash]},
      maxTimeSec * 1000 - (new Date().getTime() - startTime));
  }
  throw new Error('Unknown awaitBlock');
}
