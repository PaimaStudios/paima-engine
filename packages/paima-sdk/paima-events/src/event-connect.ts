import mqtt from 'mqtt';
import { PaimaEventBrokerNames, setupInitialListeners } from './event-utils.js';
import { PaimaEventListener } from './event-listener.js';
import { toPattern } from './builtin-events.js';
import { extract, matches } from 'mqtt-pattern';

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

  /**
   * Get client for broker
   * note: we lazy-load the client to avoid overhead if MQTT is never used
   */
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
    setupInitialListeners();
    client.on('message', (topic: string, message: Buffer) => {
      for (const [_broker, info] of Object.entries(PaimaEventListener.Instance.callbacksForTopic)) {
        for (const [pattern, callbacks] of Object.entries(info)) {
          if (matches(pattern, topic)) {
            for (const callbackInfo of Object.values<(typeof callbacks)[keyof typeof callbacks]>(
              callbacks
            )) {
              const data: Record<string, unknown> = JSON.parse(message.toString());

              const resolved = extract(toPattern(callbackInfo.event.path), topic);
              callbackInfo.callback({
                val: data,
                resolvedPath: resolved,
              });
            }
          }
        }
      }
    });
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
