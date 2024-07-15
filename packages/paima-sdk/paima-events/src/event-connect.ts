import mqtt from 'mqtt';
import type { ENV as e1 } from '@paima/utils';
import type { ENV as e2 } from '@paima/batcher-utils';
import { PaimaEventSystemParser } from './system-events.js';
import { PaimaEventBrokerNames } from './event-utils.js';

/*
 * Paima Event Connector
 * Called automatically by listeners and published when needed.
 */
export class PaimaEventConnect {
  // clients
  private static clients: {
    engine?: mqtt.MqttClient;
    batcher?: mqtt.MqttClient;
  } = {};

  constructor(private env: typeof e1 | typeof e2) {}

  public getClient(broker: PaimaEventBrokerNames): mqtt.MqttClient {
    switch (broker) {
      case PaimaEventBrokerNames.PaimaEngine: {
        return this.connectPaimaEngine();
      }
      case PaimaEventBrokerNames.Batcher:
        return this.connectBatcher();
    }
  }

  private setupClient(url: string, broker: PaimaEventBrokerNames): mqtt.MqttClient {
    const client = mqtt.connect(url);
    client.on('message', PaimaEventSystemParser.systemParser(broker));
    return client;
  }

  private connectPaimaEngine(): mqtt.MqttClient {
    if (!PaimaEventConnect.clients.engine) {
      PaimaEventConnect.clients.engine = this.setupClient(
        this.env.MQTT_ENGINE_BROKER_URL,
        PaimaEventBrokerNames.PaimaEngine
      );
    }
    return PaimaEventConnect.clients.engine;
  }

  private connectBatcher(): mqtt.MqttClient {
    if (!PaimaEventConnect.clients.batcher) {
      PaimaEventConnect.clients.batcher = this.setupClient(
        this.env.MQTT_BATCHER_BROKER_URL,
        PaimaEventBrokerNames.Batcher
      );
    }
    return PaimaEventConnect.clients.batcher;
  }
}
