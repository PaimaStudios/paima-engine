import { PaimaEventConnect } from './event-connect.js';
import type { PaimaEvent } from './events.js';

/*
 * This class provides a PaimaEventPublisher Singleton.
 */
export class PaimaEventPublisher<T extends Record<string, any>> {
  constructor(
    private event: PaimaEvent<T>,
  ) {}

  public sendMessage(message: T): void {
    const client = new PaimaEventConnect().getClient(this.event.broker);
    client.publish(this.event.getTopic(), JSON.stringify(message));
  }
}
