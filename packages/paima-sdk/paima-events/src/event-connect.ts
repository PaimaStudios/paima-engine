import mqtt from 'mqtt';
import { setupInitialListeners } from './builtin-event-utils.js';
import { PaimaEventManager } from './event-manager.js';
import { toPattern } from './utils.js';
import { extract, matches } from 'mqtt-pattern';
import { PaimaEventBrokerNames } from './types.js';

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
  public async getClient(broker: PaimaEventBrokerNames): Promise<mqtt.MqttClient> {
    switch (broker) {
      case PaimaEventBrokerNames.PaimaEngine: {
        return await this.connectPaimaEngine();
      }
      case PaimaEventBrokerNames.Batcher:
        return await this.connectBatcher();
    }
  }

  private async setupClient(url: string): Promise<mqtt.MqttClient> {
    const client = await mqtt.connectAsync(url);
    client.on('message', (topic: string, message: Buffer) => {
      for (const [_broker, info] of Object.entries(PaimaEventManager.Instance.callbacksForTopic)) {
        for (const [pattern, callbacks] of Object.entries(info)) {
          if (matches(pattern, topic)) {
            for (const callbackInfo of Object.getOwnPropertySymbols(callbacks).map(
              sym => callbacks[sym]
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

  private async connectPaimaEngine(): Promise<mqtt.MqttClient> {
    if (!PaimaEventConnect.clients.engine) {
      const broker = PaimaEventBrokerNames.PaimaEngine;
      // keep in sync with paima-engine config.ts
      const port = process.env.MQTT_ENGINE_BROKER_PORT ?? '8883';
      PaimaEventConnect.clients.engine = await this.setupClient(
        process.env.MQTT_ENGINE_BROKER_URL ?? 'ws://127.0.0.1:' + port
      );
      await setupInitialListeners(broker);
    }
    return PaimaEventConnect.clients.engine;
  }

  private async connectBatcher(): Promise<mqtt.MqttClient> {
    if (!PaimaEventConnect.clients.batcher) {
      const broker = PaimaEventBrokerNames.Batcher;
      // keep in sync with batcher config.ts
      const port = process.env.MQTT_BATCHER_BROKER_PORT ?? '8883';
      PaimaEventConnect.clients.batcher = await this.setupClient(
        process.env.MQTT_BATCHER_BROKER_URL ?? 'ws://127.0.0.1:' + port
      );
      await setupInitialListeners(broker);
    }
    return PaimaEventConnect.clients.batcher;
  }
}
