import mqtt from 'mqtt';

export type MQTTCallback = (target: string, path: string, rawObject: object) => void;
export type MQTTSystemEventsSetup = {
  path: string;
  target: 'PaimaEngine' | 'Batcher';
  isSystem?: boolean;
};
export const MQTTSystemEvents: Record<string, MQTTSystemEventsSetup> = {
  STF: { path: '/sys/stf', target: 'PaimaEngine', isSystem: true },
  BATCHER_HASH: { path: '/sys/batch_hash', target: 'Batcher', isSystem: true },
};

export class MQTTClient {
  private static lastSTFBlock = 0;
  private static hashes: Record<string, number> = {};
  private static listeners: Record<string, MQTTCallback> = {};

  private static wait(n: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, n));
  }

  private static engineClient: mqtt.MqttClient | undefined;
  private static batcherClient: mqtt.MqttClient | undefined;

  private static systemParser =
    (target: string) =>
    (path: string, message: Buffer): void => {
      // message is Buffer
      const m = message.toString();
      const data: Record<string, unknown> = JSON.parse(m);
      // Parse System Events
      if (path === MQTTSystemEvents.STF.path) {
        MQTTClient.lastSTFBlock = data.block as number;
      }
      if (path === MQTTSystemEvents.BATCHER_HASH.path) {
        MQTTClient.hashes[data.hash as string] = data.blockHeight as number;
      }
      if (MQTTClient.listeners[`${target}:${path}`]) {
        MQTTClient.listeners[`${target}:${path}`](target, path, data);
      }
      return;
    };

  public static connect(): void {
    if (MQTTClient.engineClient || MQTTClient.batcherClient) return;

    // TODO Parametrize this based on ENV.
    MQTTClient.engineClient = mqtt.connect('ws://127.0.0.1:8883');
    MQTTClient.engineClient.on('message', MQTTClient.systemParser('PaimaEngine'));

    MQTTClient.batcherClient = mqtt.connect('ws://127.0.0.1:8884');
    MQTTClient.batcherClient.on('message', MQTTClient.systemParser('Batcher'));
  }

  // TODO this should be from the shared enum
  public static subscribe(event: MQTTSystemEventsSetup, callback?: MQTTCallback): void {
    switch (event.target) {
      case 'PaimaEngine':
        if (!MQTTClient.engineClient) {
          throw new Error('Connect client first');
        }
        MQTTClient.engineClient.on('connect', () => {
          MQTTClient.engineClient!.subscribe(event.path, err => {
            if (err) console.log('MQTT[1] ERROR', err);
          });
          if (callback) MQTTClient.listeners[`${event.target}:${event.path}`] = callback;
        });
        break;
      case 'Batcher':
        if (!MQTTClient.batcherClient) {
          throw new Error('Connect client first');
        }
        MQTTClient.batcherClient.on('connect', () => {
          MQTTClient.batcherClient!.subscribe(event.path, err => {
            if (err) console.log('MQTT[2] ERROR', err);
          });
          if (callback) MQTTClient.listeners[`${event.target}:${event.path}`] = callback;
        });
        break;
    }
  }

  public static awaitBlock = async (hash: string, maxTimeSec = 20): Promise<number> => {
    console.log('Waiting for hash:', hash);
    const startTime = new Date().getTime();
    const checkTime = (): boolean => {
      return startTime + maxTimeSec * 1000 > new Date().getTime();
    };
    while (!MQTTClient.hashes[hash] && checkTime()) {
      await MQTTClient.wait(100);
    }
    const blockHeightTX = MQTTClient.hashes[hash];
    console.log('Waiting for block:', blockHeightTX);
    while (MQTTClient.lastSTFBlock < blockHeightTX && checkTime()) {
      await MQTTClient.wait(100);
    }
    return blockHeightTX;
  };
}
