/* eslint-disable no-console */
import { fillPath, keysForPath } from './utils.js';
import { PaimaEventConnect } from './event-connect.js';
import { PaimaEventBrokerNames } from './builtin-event-utils.js';
import type { Static } from '@sinclair/typebox';
import { EventPathAndDef, ResolvedPath, UserFilledPath } from './types.js';

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
export class PaimaEventManager {
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
  static Instance: PaimaEventManager = new PaimaEventManager();

  /**
   * Subscribe to events for a topic filtered by a set of indexed variables
   * @param broker
   * @param filter a filter to generate the MQTT topic syntax to monitor for new events
   * @param callback a callback to call when a message matching this topic is encountered
   * @returns a unique symbol to use to unsubscribe the specific callback
   */
  public subscribe<Event extends EventPathAndDef>(
    args: {
      topic: Event;
      filter: UserFilledPath<Event['path']>;
    },
    callback: (args: Static<Event['type']> & ResolvedPath<Event['path']>) => void
  ): symbol {
    return this.subscribeExplicit<Event>(
      {
        topic: args.topic,
        filter: args.filter,
      },
      ({ val, resolvedPath }) => callback({ ...val, ...resolvedPath })
    );
  }
  /**
   * Subscribe to events for a topic filtered by a set of indexed variables
   *
   * This is an explicit version of the `subscribe` function
   * by explicit, it means MQTT topic vars and content are treated differently
   * this is worse devx, but supports cases where topic & content have vars with overlapping names
   * @param broker
   * @param filter a filter to generate the MQTT topic syntax to monitor for new events
   * @param callback a callback to call when a message matching this topic is encountered
   * @returns a unique symbol to use to unsubscribe the specific callback
   */
  public subscribeExplicit<Event extends EventPathAndDef>(
    args: {
      topic: Event;
      filter: UserFilledPath<Event['path']>;
    },
    callback: (args: CallbackArgs<Event>) => void
  ): symbol {
    const client = new PaimaEventConnect().getClient(args.topic.broker);
    const topic = fillPath(args.topic.path, args.filter);

    const clientSubscribe = (): void => {
      client.subscribe(topic, (err: any) => {
        if (err) {
          console.log(`MQTT[${args.topic.broker}] ERROR`, err);
        }
      });
    };

    if (client.connected) clientSubscribe();
    else client.on('connect', clientSubscribe);

    // keep track of a unique symbol for the subscription that can be used to unsubscribe later
    const symbol = Symbol(topic);
    this.symbolToSubscription[symbol] = {
      broker: args.topic.broker,
      topic,
    };

    const callbacksForTopic = this.callbacksForTopic[args.topic.broker][topic] ?? {};
    callbacksForTopic[symbol] = {
      callback,
      event: args.topic,
    };
    this.callbacksForTopic[args.topic.broker][topic] = callbacksForTopic;

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
    topic: Event,
    event: ResolvedPath<Event['path']> & Static<Event['type']>
  ): void {
    const filterKeys = new Set(keysForPath(topic.path));
    const filter = Object.fromEntries(
      Object.entries(event).filter(([key, _]) => filterKeys.has(key))
    ) as any; // typescript can't know this filter actually matches the static type
    const message = Object.fromEntries(
      Object.entries(event).filter(([key, _]) => !filterKeys.has(key))
    ) as any; // typescript can't know this filter actually matches the static type
    return this.sendMessageExplicit<Event>({ topic, filter }, message);
  }
  public sendMessageExplicit<Event extends EventPathAndDef>(
    args: {
      topic: Event;
      filter: ResolvedPath<Event['path']>;
    },
    message: Static<Event['type']>
  ): void {
    const client = new PaimaEventConnect().getClient(args.topic.broker);
    const topicPath = fillPath(args.topic.path, args.filter);
    client.publish(topicPath, JSON.stringify(message));
  }
}
