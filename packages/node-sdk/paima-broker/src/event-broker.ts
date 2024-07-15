/* eslint-disable no-console */

import type { ENV as e1 } from '@paima/utils';
import type { ENV as e2 } from '@paima/batcher-utils';
import Aedes from 'aedes';
import type { Server } from 'aedes-server-factory';
import { createServer } from 'aedes-server-factory';

/*
 * This class implements a local MQTT Broker.
 */
export class PaimaEventBroker {
  // Batcher & PaimaEngine Share MQTT ENV Variables.
  constructor(private env: typeof e1 | typeof e2) {}
  private static aedes: Aedes | null = null;
  private static server: Server | null = null;

  /*
   * Get & Init Server Singleton
   */
  public getServer(): Server {
    if (!this.env.MQTT_BROKER) {
      throw new Error('Local MQTT Broker is disabled.');
    }
    if (PaimaEventBroker.server) return PaimaEventBroker.server;

    PaimaEventBroker.aedes = new Aedes();
    PaimaEventBroker.server = createServer(PaimaEventBroker.aedes, { ws: true });;

    // WEBSOCKET PROTOCOL SERVER
    PaimaEventBroker.server.listen(
      this.env.MQTT_BROKER_PORT,
      () =>
        console.log('MQTT-WS Server Started at PORT ' + this.env.MQTT_BROKER_PORT)
    );
    return PaimaEventBroker.server;
  }
}
