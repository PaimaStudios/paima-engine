/* eslint-disable no-console */
import type mqtt from 'mqtt';

import { PaimaEventConnect } from './event-connect.js';
import type { PaimaEvent } from './events.js';

import type { ENV as e1 } from '@paima/utils';
import type { ENV as e2 } from '@paima/batcher-utils';
import type { PaimaEventBrokerProtocols } from './event-utils.js';
import { PaimaEventBrokerNames } from './event-utils.js';

export type MQTTCallback = (
  target: string,
  path: string | ((address: string) => string),
  rawObject: object
) => void;

export class PaimaEventListener {
  /* List of event processors */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static subscriptions: PaimaEvent<any>[] = [];

  constructor(private env: typeof e1 | typeof e2) {}

  /* Subscribe to System or Custom Events */
  public subscribe<T extends Record<string, unknown>>(protocol: PaimaEventBrokerProtocols, event: PaimaEvent<T>): void {
    if (PaimaEventListener.subscriptions.find(e => e.name === event.name)) {
      throw new Error('Already subscribed to events for ' + event.name);
    }
    let client: mqtt.MqttClient;
    switch (event.broker) {
      case PaimaEventBrokerNames.PaimaEngine: {
        client = new PaimaEventConnect(this.env).connectPaimaEngine(protocol);
        break;
      }
      case PaimaEventBrokerNames.Batcher:
        client = new PaimaEventConnect(this.env).connectBatcher(protocol);
        break;
    }

    if (!client) throw new Error('Unknown client');

    const clientSubscribe = (): void => {
      client.subscribe(event.path.fullPath, (err: any) => {
        if (err) console.log(`MQTT[${event.broker}] ERROR`, err);
        console.log('MQTT Subscription for', event.name, event.broker, event.path.fullPath)
      });
    }

    if (client.connected) clientSubscribe();
    else client.on('connect', clientSubscribe);
    PaimaEventListener.subscriptions.push(event);
  }

}
