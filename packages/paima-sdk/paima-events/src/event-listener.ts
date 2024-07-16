/* eslint-disable no-console */
import { EventPathAndDef, fillPath, ResolvedPath, Undefined } from './builtin-events.js';
import { PaimaEventConnect } from './event-connect.js';
import { PaimaEventBrokerNames } from './event-utils.js';
import type { Static } from '@sinclair/typebox';

export type CallbackArgs<Event extends EventPathAndDef> = {
  // schema of the content emitted
  // ex: block/5 -> block content
  val: Static<Event['type']>;
  // resolution of the variables specified in the topic name
  // ex: block/5 -> { blockId: 5 }
  resolvedPath: ResolvedPath<Event['path']>;
};

export type CallbackAndMetadata<Event extends EventPathAndDef> = {
  callback: (args: CallbackArgs<Event>) => void;
  event: Event;
};

/*
 * This class subscribes to specific topics, and stores the callbacks for event processing.
 */
export class PaimaEventListener {
  public callbacksForTopic: Record<
    PaimaEventBrokerNames,
    Record<
      string, // topic
      Record<symbol, CallbackAndMetadata<any>>
    >
  > = {
    [PaimaEventBrokerNames.PaimaEngine]: {},
    [PaimaEventBrokerNames.Batcher]: {},
  };
  public symbolToSubscription: Record<symbol, { broker: PaimaEventBrokerNames; topic: string }> =
    {};
  static Instance: PaimaEventListener = new PaimaEventListener();

  /**
   * @param broker
   * @param topic a topic using MQTT syntax to monitor for new events
   * @param callback a callback to call when a message matching this topic is encountered
   * @returns a unique symbol to use to unsubscribe the specific callback
   */
  public subscribe<Event extends EventPathAndDef>(
    event: Event,
    topicArgs: Partial<Undefined<ResolvedPath<Event['path']>>>,
    callback: (args: CallbackArgs<Event>) => void
  ): symbol {
    const client = new PaimaEventConnect().getClient(event.broker);
    const topic = fillPath(event.path, topicArgs);

    const clientSubscribe = (): void => {
      client.subscribe(topic, (err: any) => {
        if (err) {
          console.log(`MQTT[${event.broker}] ERROR`, err);
        }
      });
    };

    if (client.connected) clientSubscribe();
    else client.on('connect', clientSubscribe);

    // keep track of a unique symbol for the subscription that can be used to unsubscribe later
    const symbol = Symbol(topic);
    this.symbolToSubscription[symbol] = {
      broker: event.broker,
      topic,
    };

    const callbacksForTopic = this.callbacksForTopic[event.broker][topic] ?? {};
    callbacksForTopic[symbol] = {
      callback,
      event,
    };
    this.callbacksForTopic[event.broker][topic] = callbacksForTopic;

    return symbol;
  }

  public unsubscribe(event: symbol): void {
    const { topic, broker } = this.symbolToSubscription[event];
    if (topic == null) {
      console.error('Subscription not found', event.description);
      return;
    }
    delete this.symbolToSubscription[event];

    const callbacks = this.callbacksForTopic[broker][topic];
    delete callbacks[event];
    const numCallbacks = Object.keys(callbacks).length - 1; // objs are small, so this is fast enough in practice

    // if there are no references left to this topic, we can unsubscribe from it
    if (numCallbacks === 0) {
      const client = new PaimaEventConnect().getClient(broker);
      delete this.callbacksForTopic[broker][topic];

      const clientUnsubscribe = (): void => {
        client.unsubscribe(topic, (err: any) => {
          if (err) console.log(`MQTT[${broker}] ERROR`, err);
        });
      };

      if (client.connected) clientUnsubscribe();
      else client.on('connect', clientUnsubscribe);
    }
  }

  public sendMessage<Event extends EventPathAndDef>(
    event: Event,
    topicArgs: ResolvedPath<Event['path']>,
    message: Static<Event['type']>
  ): void {
    const client = new PaimaEventConnect().getClient(event.broker);
    const topic = fillPath(event.path, topicArgs);
    client.publishAsync(topic, JSON.stringify(message));
  }
}
