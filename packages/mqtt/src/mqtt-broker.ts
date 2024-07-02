import type { ENV as e1 } from '@paima/utils';
import type { ENV as e2 } from '@paima/batcher-utils';
import Aedes from 'aedes';
import type { Server } from 'aedes-server-factory';
import { createServer } from 'aedes-server-factory';

// TODO GET ENV From init method

export enum MQTTBrokerProtocols {
  WEBSOCKET = 'ws',
  MQTT = 'mqtt',
}

/*
 * This class implements a local MQTT Broker
 */
export class MQTTBroker {
  constructor(private env: typeof e1 | typeof e2) {}

  private getPort(protocol: MQTTBrokerProtocols): number {
    switch (protocol) {
      case MQTTBrokerProtocols.WEBSOCKET:
        return this.env.MQTT_BROKER_WS_PORT;
      case MQTTBrokerProtocols.MQTT:
        return this.env.MQTT_BROKER_PORT;
    }
  }
  private static aedes: Aedes | null = null;
  private static server: Record<MQTTBrokerProtocols, Server> | null = null;
  // Get/Init Singleton
  public getServer(): Record<MQTTBrokerProtocols, Server> {
    if (!this.env.MQTT_BROKER) {
      throw new Error('Local MQTT Broker is disabled.');
    }
    if (MQTTBroker.server) return MQTTBroker.server;

    MQTTBroker.aedes = new Aedes();
    MQTTBroker.server = {
      [MQTTBrokerProtocols.MQTT]: createServer(MQTTBroker.aedes),
      [MQTTBrokerProtocols.WEBSOCKET]: createServer(MQTTBroker.aedes, { ws: true }),
    };

    // MQTT
    MQTTBroker.server[MQTTBrokerProtocols.MQTT].listen(
      this.getPort(MQTTBrokerProtocols.MQTT),
      () => {
        console.log('MQTT Server Started @', this.env.MQTT_BROKER_URL);
      }
    );

    // Websocket
    MQTTBroker.server[MQTTBrokerProtocols.WEBSOCKET].listen(
      this.getPort(MQTTBrokerProtocols.WEBSOCKET),
      () => {
        console.log('MQTT-WS Server Started @', this.env.MQTT_BROKER_WS_URL);
      }
    );
    return MQTTBroker.server;
  }
}
