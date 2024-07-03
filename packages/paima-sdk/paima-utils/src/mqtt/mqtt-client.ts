import mqtt from 'mqtt';
import { MQTTSystemEventsNames } from './mqtt-events.js';
import type { MQTTEvent } from './mqtt-events.js';

export type MQTTCallback = (
  target: string,
  path: string | ((address: string) => string),
  rawObject: object
) => void;

export class MQTTClient {
  /* Shared storage for last blocked STF processed */
  private static lastSTFBlock = 0;
  /* Map of known hashes */
  private static hashes: Record<string, number> = {};
  /* List of event processors */
  private static subscriptions: MQTTEvent[] = [];

  /* ws-clients */
  private static engineClient: mqtt.MqttClient | undefined;
  private static batcherClient: mqtt.MqttClient | undefined;

  private static wait(n: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, n));
  }

  /* Processes new messages, applies system transformations and side effects before calling the user "callback" */
  private static systemParser =
    (broker: string) =>
    (path: string, message: Buffer): void => {
      // message is Buffer
      const m = message.toString();
      const data: Record<string, unknown> = JSON.parse(m);
      const mqttEvent = MQTTClient.subscriptions.find(s => s.match(broker, path));
      if (!mqttEvent) {
        console.log('Critical error not event manager for', { broker, path, message: m });
        return;
      }
      // Default system behaviors
      switch (mqttEvent.name) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        case MQTTSystemEventsNames.STF_GLOBAL:
          MQTTClient.lastSTFBlock = data.block as number;
          break;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        case MQTTSystemEventsNames.BATCHER_HASH_GLOBAL:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        case MQTTSystemEventsNames.BATCHER_HASH_$ADDRESS:
          MQTTClient.hashes[data.hash as string] = data.blockHeight as number;
          break;
      }

      if (mqttEvent.callback) {
        mqttEvent.callback(mqttEvent, data);
      }
      return;
    };

  /* Connect to paima-engine & batcher broker */
  public static connect(): void {
    if (MQTTClient.engineClient || MQTTClient.batcherClient) return;

    // TODO Parametrize this based on ENV.
    MQTTClient.engineClient = mqtt.connect('ws://127.0.0.1:8883');
    MQTTClient.engineClient.on('message', MQTTClient.systemParser('paima-engine'));

    MQTTClient.batcherClient = mqtt.connect('ws://127.0.0.1:8884');
    MQTTClient.batcherClient.on('message', MQTTClient.systemParser('batcher'));
  }

  /* Subscribe to System or Custom Events */
  public static subscribe(event: MQTTEvent): void {
    let client;
    switch (event.broker) {
      case 'paima-engine':
        if (MQTTClient.engineClient) client = MQTTClient.engineClient;
        break;
      case 'batcher':
        if (MQTTClient.batcherClient) client = MQTTClient.batcherClient;
        break;
    }

    if (!client) throw new Error('Unknown client');

    client.on('connect', () => {
      client.subscribe(event.path.fullPath, (err: any) => {
        if (err) console.log(`MQTT[${event.broker}] ERROR`, err);
      });
    });

    MQTTClient.subscriptions.push(event);
  }

  /* Helper to wait when hash is ready */
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
