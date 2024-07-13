/* eslint-disable no-console */

import type { ENV as e1 } from '@paima/utils';
import type { ENV as e2 } from '@paima/batcher-utils';
import Aedes from 'aedes';
import type { Server } from 'aedes-server-factory';
import { createServer } from 'aedes-server-factory';

import { PaimaEventBrokerProtocols } from '@paima/events';

/*
 * This class implements a local MQTT Broker.
 */
export class PaimaEventBroker {
  // Batcher & PaimaEngine Share MQTT ENV Variables.
  constructor(private env: typeof e1 | typeof e2) {}
  private static aedes: Aedes | null = null;
  private static server: Record<PaimaEventBrokerProtocols, Server> | null = null;

  /*
   * Get & Init Server Singleton
   */
  public getServer(): Record<PaimaEventBrokerProtocols, Server> {
    if (!this.env.MQTT_BROKER) {
      throw new Error('Local MQTT Broker is disabled.');
    }
    if (PaimaEventBroker.server) return PaimaEventBroker.server;

    PaimaEventBroker.aedes = new Aedes();
    PaimaEventBroker.server = {
      [PaimaEventBrokerProtocols.MQTT]: createServer(PaimaEventBroker.aedes),
      [PaimaEventBrokerProtocols.WEBSOCKET]: createServer(PaimaEventBroker.aedes, { ws: true }),
    };

    // MQTT PROTOCOL SERVER
    PaimaEventBroker.server[PaimaEventBrokerProtocols.MQTT].listen(
      this.getPort(PaimaEventBrokerProtocols.MQTT),
      () => console.log('MQTT Server Started at PORT ', this.getPort(PaimaEventBrokerProtocols.MQTT))
    );

    // WEBSOCKET PROTOCOL SERVER
    PaimaEventBroker.server[PaimaEventBrokerProtocols.WEBSOCKET].listen(
      this.getPort(PaimaEventBrokerProtocols.WEBSOCKET),
      () => console.log('MQTT-WS Server Started at PORT', this.getPort(PaimaEventBrokerProtocols.WEBSOCKET))
    );
    return PaimaEventBroker.server;
  }

  private getPort(protocol: PaimaEventBrokerProtocols): number {
    switch (protocol) {
      case PaimaEventBrokerProtocols.WEBSOCKET:
        return this.env.MQTT_BROKER_WS_PORT;
      case PaimaEventBrokerProtocols.MQTT:
        return this.env.MQTT_BROKER_PORT;
    }
  }
}
