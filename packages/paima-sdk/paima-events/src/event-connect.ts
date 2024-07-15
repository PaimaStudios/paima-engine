import mqtt from 'mqtt';
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
      // keep in sync with paima-engine config.ts
      const port = process.env.MQTT_ENGINE_BROKER_PORT ?? '8883';
      PaimaEventConnect.clients.engine = this.setupClient(
        process.env.MQTT_ENGINE_BROKER_URL ?? 'ws://127.0.0.1:' + port,
        PaimaEventBrokerNames.PaimaEngine
      );
    }
    return PaimaEventConnect.clients.engine;
  }

  private connectBatcher(): mqtt.MqttClient {
    if (!PaimaEventConnect.clients.batcher) {
      // keep in sync with batcher config.ts
      const port = process.env.MQTT_BATCHER_BROKER_PORT ?? '8883';
      PaimaEventConnect.clients.batcher = this.setupClient(
        process.env.MQTT_BATCHER_BROKER_URL ?? 'ws://127.0.0.1:' + port,
        PaimaEventBrokerNames.Batcher
      );
    }
    return PaimaEventConnect.clients.batcher;
  }
}
