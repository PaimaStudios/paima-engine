import mqtt from 'mqtt';
import type { ENV as e1 } from '@paima/utils';
import type { ENV as e2 } from '@paima/batcher-utils';
import { PaimaEventSystemParser } from './system-events.js';
import { PaimaEventBrokerNames, PaimaEventBrokerProtocols} from './event-utils.js';

/*
 * Paima Event Connector
 * Called automatically by listeners and published when needed.
 */
export class PaimaEventConnect {
  // clients
  private static clients: {
    engine_mqtt?: mqtt.MqttClient,
    engine_ws?: mqtt.MqttClient,
    batcher_mqtt?: mqtt.MqttClient,
    batcher_ws?: mqtt.MqttClient,
  } = {};

  constructor(private env: typeof e1 | typeof e2) { }

  private setupClient(url: string, broker: PaimaEventBrokerNames): mqtt.MqttClient {
    const client = mqtt.connect(url);
    client.on('message', PaimaEventSystemParser.systemParser(broker));
    return client;
  }

  public connectPaimaEngine(protocol: PaimaEventBrokerProtocols): mqtt.MqttClient {
    switch (protocol) {
      case PaimaEventBrokerProtocols.MQTT:
        if (!PaimaEventConnect.clients.engine_mqtt) {
        PaimaEventConnect.clients.engine_mqtt = this.setupClient(this.env.MQTT_ENGINE_BROKER_URL, PaimaEventBrokerNames.PaimaEngine);
        }
        return PaimaEventConnect.clients.engine_mqtt;

      case PaimaEventBrokerProtocols.WEBSOCKET:
        if (!PaimaEventConnect.clients.engine_ws) {
        PaimaEventConnect.clients.engine_ws = this.setupClient(this.env.MQTT_ENGINE_BROKER_WS_URL, PaimaEventBrokerNames.PaimaEngine);
        }
        return PaimaEventConnect.clients.engine_ws;
    }
  }

  public connectBatcher(protocol: PaimaEventBrokerProtocols): mqtt.MqttClient {
    switch (protocol) {
      case PaimaEventBrokerProtocols.MQTT:
        if (!PaimaEventConnect.clients.batcher_mqtt) {
          PaimaEventConnect.clients.batcher_mqtt = this.setupClient(this.env.MQTT_BATCHER_BROKER_URL, PaimaEventBrokerNames.Batcher);
        }
        return PaimaEventConnect.clients.batcher_mqtt;
      case PaimaEventBrokerProtocols.WEBSOCKET:
      if (!PaimaEventConnect.clients.batcher_ws) {
      PaimaEventConnect.clients.batcher_ws = this.setupClient(this.env.MQTT_BATCHER_BROKER_WS_URL, PaimaEventBrokerNames.Batcher);
      } return PaimaEventConnect.clients.batcher_ws;
    }
   }
}