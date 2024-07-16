/* eslint-disable no-console */
import Aedes from 'aedes';
import type { Server } from 'aedes-server-factory';
import { createServer } from 'aedes-server-factory';

/*
 * This class implements a local MQTT Broker.
 */
export class PaimaEventBroker {
  constructor(private broker: 'Paima-Engine' | 'Batcher') {}
  private static aedes: Aedes | null = null;
  private static server: Server | null = null;

  /*
   * Get & Init Server Singleton
   */
  public getServer(): Server {
    this.checkEnabled();
    if (PaimaEventBroker.server) return PaimaEventBroker.server;

    PaimaEventBroker.aedes = new Aedes();
    PaimaEventBroker.server = createServer(PaimaEventBroker.aedes, { ws: true });

    // WEBSOCKET PROTOCOL SERVER
    PaimaEventBroker.server.listen(this.getPort(), () =>
      console.log('MQTT-WS Server Started at PORT ' + this.getPort())
    );
    return PaimaEventBroker.server;
  }

  private checkEnabled(): void {
    // TODO: keep in sync with paima-engine config.ts
    if (process.env.MQTT_BROKER == null) return;
    // TODO: keep in sync with paima-engine config.ts
    if (!['true', '1', 'yes'].includes(String(process.env.MQTT_BROKER).toLocaleLowerCase())) {
      throw new Error('Local MQTT Broker is disabled.');
    }
  }

  private getPort(): number {
    switch (this.broker) {
      // TODO: use env vars without duplicating default here
      case 'Paima-Engine': {
        return parseInt(process.env.MQTT_ENGINE_BROKER_PORT ?? '8883', 10);
      }
      case 'Batcher': {
        return parseInt(process.env.MQTT_BATCHER_BROKER_PORT ?? '8884', 10);
      }
    }
    throw new Error('Unknown engine');
  }
}
