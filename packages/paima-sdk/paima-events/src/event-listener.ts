/* eslint-disable no-console */
import { PaimaEventConnect } from './event-connect.js';
import type { PaimaEvent } from './events.js';

export type MQTTCallback = (
  target: string,
  path: string | ((address: string) => string),
  rawObject: object
) => void;


/* 
 * This class subscribes to specific topics, and stores the callbacks for event processing.
 */
export class PaimaEventListener {
  /* List of event processors */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static subscriptions: PaimaEvent<any>[] = [];

  /* Subscribe to System or Custom Events */
  public subscribe<T extends Record<string, unknown>>(
    event: PaimaEvent<T>
  ): void {
    if (PaimaEventListener.subscriptions.find(e => e.topic === event.topic)) {
      throw new Error('Already subscribed to events for ' + event.name + ' ' + event.topic);
    }
    const client = new PaimaEventConnect().getClient(event.broker);

    const clientSubscribe = (): void => {
      client.subscribe(event.topic, (err: any) => {
        if (err) console.log(`MQTT[${event.broker}] ERROR`, err);
      });
    };

    if (client.connected) clientSubscribe();
    else client.on('connect', clientSubscribe);
    PaimaEventListener.subscriptions.push(event);
  }

  public unsubscribe<T extends Record<string, unknown>>(
    event: PaimaEvent<T>
  ): void {
    const client = new PaimaEventConnect().getClient(event.broker);

     const clientUnsubscribe = (): void => {
      client.unsubscribe(event.topic, (err: any) => {
        if (err) console.log(`MQTT[${event.broker}] ERROR`, err);
      });
    };

    if (client.connected) clientUnsubscribe();
    else client.on('connect', clientUnsubscribe);

    const index = PaimaEventListener.subscriptions.findIndex(e => e.topic === event.topic);
    if (index >= 0) PaimaEventListener.subscriptions.splice(index, 1);
    else console.log('Subscription not found', event.name + ' ' + event.topic);
  }

 
}
