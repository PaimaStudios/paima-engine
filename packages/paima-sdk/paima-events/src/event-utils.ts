import { BuiltinEvents } from './builtin-events.js';
import { PaimaEventListener } from './event-listener.js';

export enum PaimaEventBrokerNames {
  PaimaEngine = 'paima-engine',
  Batcher = 'batcher',
}

let bestBlock = 0;

export function setupInitialListeners() {
  PaimaEventListener.Instance.subscribe(
    BuiltinEvents.RollupBlock,
    { blockId: undefined },
    ({ val }) => {
      bestBlock = Math.max(val.blockHeight, bestBlock);
    }
  );
}

/*
 * Helper to wait when batcher hash is processed by the STF
 */
export async function awaitBlockWS(blockHeight: number, maxTimeSec = 20): Promise<number> {
  const startTime = new Date().getTime();
  const checkTime = (): boolean => startTime + maxTimeSec * 1000 > new Date().getTime();

  while (bestBlock < blockHeight) {
    if (!checkTime) throw new Error('Block not processed');
    await wait(100);
  }
  return bestBlock;
}

/*
 * Helper to wait for batcher input hash, and then wait the for the corresponding block
 */
export function awaitBatcherHash(batchHash: string, maxTimeSec = 20): Promise<number> {
  const startTime = new Date().getTime();

  let subscriptionSymbol: symbol;
  return Promise.race([
    (async (): Promise<number> => {
      await wait(maxTimeSec * 1000);
      throw new Error('TIMEOUT');
    })(),
    new Promise<number>((resolve, reject) => {
      subscriptionSymbol = PaimaEventListener.Instance.subscribe(
        BuiltinEvents.BatcherHash,
        { batchHash },
        ({ val }) => {
          const remainingTime = maxTimeSec - (new Date().getTime() - startTime);
          awaitBlockWS(val.block_height, remainingTime)
            .then(resolve)
            .catch(e => reject(e.message));
        }
      );
    }),
  ]).finally(() => {
    if (subscriptionSymbol != null) {
      PaimaEventListener.Instance.unsubscribe(subscriptionSymbol);
    }
  });
}

const wait = async (ms: number): Promise<void> =>
  await new Promise<void>(resolve => {
    setTimeout(() => resolve(), ms);
  });
