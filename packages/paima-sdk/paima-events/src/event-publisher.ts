import type mqtt from 'mqtt';
import { PaimaEventConnect } from './event-connect.js';
import type { ENV as e1 } from '@paima/utils';
import type { ENV as e2 } from '@paima/batcher-utils';
import type { PaimaEventBrokerProtocols } from './event-utils.js';
import { PaimaEventBrokerNames } from './event-utils.js';
import type { PaimaEvent } from './events.js';

/*
 * This class provides a PaimaEventPublisher Singleton.
 */
export class PaimaEventPublisher<T extends Record<string, any>> {
  constructor(private event: PaimaEvent<T>, private protocol: PaimaEventBrokerProtocols, private env: typeof e1 | typeof e2) {}

  private getClient(): mqtt.MqttClient {
    switch (this.event.broker) {
      case PaimaEventBrokerNames.PaimaEngine:
        return new PaimaEventConnect(this.env).connectPaimaEngine(this.protocol);
      case PaimaEventBrokerNames.Batcher:
        return new PaimaEventConnect(this.env).connectBatcher(this.protocol);
    }
  }

  public sendMessage(message: T): void {
    const client = this.getClient();
    client.publish(this.event.getTopic(), JSON.stringify(message));
  }
}
