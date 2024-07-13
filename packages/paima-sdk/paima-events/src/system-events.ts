import { doLog } from '@paima/utils';
import { PaimaEventBrokerNames } from './event-utils.js';
import { PaimaEventListener } from './event-listener.js';
import { PaimaEvent } from './events.js';

/*
 * This class applies side-effects to system effects and then call the user defined callback
 */
export class PaimaEventSystemParser {
  /* Shared storage for last blocked STF processed */
  public static lastSTFBlock = 0;
  /* Map of known hashes */
  public static hashes: Record<string, number> = {};

  /* Processes new messages, applies system transformations and side effects before calling the user "callback" */
  public static systemParser =
    (broker: PaimaEventBrokerNames) =>
    (path: string, message: Buffer): void => {
      // message is Buffer
      const m = message.toString();

      const data: Record<string, unknown> = JSON.parse(m);
      const mqttEvent = PaimaEventListener.subscriptions.find(s => s.match(broker, path));
      if (!mqttEvent) {
        doLog('Critical error not event manager for', { broker, path, message: m });
        return;
      }
      // Default system behaviors
      switch (mqttEvent.name) {
        //  eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        case PaimaEventSystemName.STF_GLOBAL:
          PaimaEventSystemParser.lastSTFBlock = data.block as number;
          break;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        case PaimaEventSystemName.BATCHER_HASH_$ADDRESS:
          PaimaEventSystemParser.hashes[data.hash as string] = data.blockHeight as number;
          break;
      }

      if (mqttEvent.callback) {
        mqttEvent.callback(mqttEvent, data);
      }
      return;
    };
}

/*
 * Default System Events Names
 */
enum PaimaEventSystemName {
  STF_GLOBAL = 'STF_GLOBAL',
  BATCHER_HASH_GLOBAL = 'BATCHER_HASH_GLOBAL',
  BATCHER_HASH_$ADDRESS = 'BATCHER_HASH_$ADDRESS',
}

/*
 * Default System Events.
 */
const systemEvent = (path: string[]): string => {
  return ['system', ...path].join('/');
}

export class PaimaEventSystemSTFGlobal extends PaimaEvent<{
  block: number;
  emulated: number | undefined;
}> {
  constructor() {
    super(
      PaimaEventSystemName.STF_GLOBAL,
      PaimaEventBrokerNames.PaimaEngine,
      systemEvent(['engine', 'stf'])
    );
  }
}

export class PaimaEventSystemBatcherHashGlobal extends PaimaEvent<{
  input_hash: string;
  block_height: number;
  transaction_hash: string;
}> {
  constructor() {
    super(
      PaimaEventSystemName.BATCHER_HASH_GLOBAL,
      PaimaEventBrokerNames.Batcher,
      systemEvent(['batcher', 'hash'])
    );
  }
}

export class PaimaEventSystemBatcherHashAddress extends PaimaEvent<{
  input_hash: string;
  block_height: number;
  transaction_hash: string;
}> {
  constructor(address: string) {
    super(
      PaimaEventSystemName.BATCHER_HASH_$ADDRESS,
      PaimaEventBrokerNames.Batcher,
      PaimaEventSystemBatcherHashAddress.buildTopic(address)
    );
  }

  public static buildTopic(address: string): string {
    return systemEvent(['batcher', address]);
  }
}
