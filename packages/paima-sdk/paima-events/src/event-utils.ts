import { PaimaEventSystemBatcherHashAddress, PaimaEventSystemParser } from './system-events.js';
import { PaimaEventListener } from './event-listener.js';

export enum PaimaEventBrokerNames {
  PaimaEngine = 'paima-engine',
  Batcher = 'batcher',
}

/*
 * Helper to wait when batcher hash is processed by the STF
 */
export async function awaitBlockWS(blockHeight: number, maxTimeSec = 20): Promise<number> {
  const startTime = new Date().getTime();
  const checkTime = (): boolean => startTime + maxTimeSec * 1000 > new Date().getTime();

  while (PaimaEventSystemParser.lastSTFBlock < blockHeight) {
    if (!checkTime) throw new Error('Block not processed');
    await wait(100);
  }
  return PaimaEventSystemParser.lastSTFBlock;
}

/*
 * Helper to wait for batcher input hash, and then wait the for the corresponding block
 */
export function awaitBatcherHash(hash: string, maxTimeSec = 20): Promise<number> {
  const startTime = new Date().getTime();
  const event = new PaimaEventSystemBatcherHashAddress(hash);
  const listener = new PaimaEventListener();

  return Promise.race([
    (async (): Promise<number> => {
      await wait(maxTimeSec * 1000);
      throw new Error('TIMEOUT');
    })(),
    new Promise<number>((resolve, reject) => {
      event.callback = (_, message): void => {
        const remainingTime = maxTimeSec - (new Date().getTime() - startTime);
        awaitBlockWS(message.block_height, remainingTime)
          .then(resolve)
          .catch((e) => reject(e.message))
      };
      listener.subscribe(event);
    })
  ]).finally(() => {
    listener.unsubscribe(event);
  });
}

const wait = async (ms: number): Promise<void> =>
  await new Promise<void>(resolve => {
    setTimeout(() => resolve(), ms);
  });
