// import { ENV } from '@paima/utils';
import Aedes from 'aedes';
import type { Server } from 'aedes-server-factory';
import { createServer } from 'aedes-server-factory';

export enum MQTTBrokerProtocols {
  WEBSOCKET = 'ws',
  MQTT = 'mqtt',
}

/*
 * This class implements a local MQTT Broker
 */
export class MQTTBroker {
  public static getConnectionString(protocol: MQTTBrokerProtocols): string {
    return `${protocol}://127.0.0.1:${MQTTBroker.getPort(protocol)}`;
  }

  // TODO add these to init
  // We cannot read ENV directly as it Batcher / PaimaEngine ENV source are different
  private static getPort(protocol: MQTTBrokerProtocols): number {
    switch (protocol) {
      case MQTTBrokerProtocols.WEBSOCKET:
        return 8883; // ENV.MQTT_BROKER_WS_PORT;
      case MQTTBrokerProtocols.MQTT:
        return 1883; // ENV.MQTT_BROKER_PORT;
    }
  }
  private static aedes: Aedes | null = null;
  private static server: Record<MQTTBrokerProtocols, Server> | null = null;
  // Get/Init Singleton
  public static getServer(): Record<MQTTBrokerProtocols, Server> {
    // if (!ENV.MQTT_BROKER) {
    //   throw new Error('Local MQTT Broker is disabled.');
    // }

    if (MQTTBroker.server) return MQTTBroker.server;

    MQTTBroker.aedes = new Aedes();
    MQTTBroker.server = {
      [MQTTBrokerProtocols.MQTT]: createServer(MQTTBroker.aedes),
      [MQTTBrokerProtocols.WEBSOCKET]: createServer(MQTTBroker.aedes, { ws: true }),
    };

    // MQTT
    MQTTBroker.server[MQTTBrokerProtocols.MQTT].listen(
      MQTTBroker.getPort(MQTTBrokerProtocols.MQTT),
      function () {
        console.log(
          'MQTT Server Started @',
          MQTTBroker.getConnectionString(MQTTBrokerProtocols.MQTT)
        );
      }
    );

    // Websocket
    MQTTBroker.server[MQTTBrokerProtocols.WEBSOCKET].listen(
      MQTTBroker.getPort(MQTTBrokerProtocols.WEBSOCKET),
      function () {
        console.log(
          'MQTT-WS Server Started @',
          MQTTBroker.getConnectionString(MQTTBrokerProtocols.WEBSOCKET)
        );
      }
    );
    return MQTTBroker.server;
  }
}
