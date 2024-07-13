import { wait } from '@paima/utils';
import { PaimaEventSystemParser } from './system-events.js';

export enum PaimaEventBrokerProtocols {
  WEBSOCKET = 'ws',
  MQTT = 'mqtt',
}

export enum PaimaEventBrokerNames {
  PaimaEngine = 'paima-engine',
  Batcher = 'batcher',
}

/*
 * Helper to wait when batcher hash is processed by the STF
 */
export async function awaitBlock(hash: string, maxTimeSec = 20): Promise<number> {
  // eslint-disable-next-line no-console
  console.log('Waiting for hash:', hash);
  const startTime = new Date().getTime();
  const checkTime = (): boolean => {
    return startTime + maxTimeSec * 1000 > new Date().getTime();
  };
  while (!PaimaEventSystemParser.hashes[hash] && checkTime()) {
    await wait(100);
  }
  const blockHeightTX = PaimaEventSystemParser.hashes[hash];

  // eslint-disable-next-line no-console
  console.log('Waiting for block:', blockHeightTX);
  while (PaimaEventSystemParser.lastSTFBlock < blockHeightTX && checkTime()) {
    await wait(100);
  }
  return blockHeightTX;
}
