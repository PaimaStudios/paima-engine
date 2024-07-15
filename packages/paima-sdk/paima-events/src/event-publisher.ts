import { PaimaEventConnect } from './event-connect.js';
import type { ENV as e1 } from '@paima/utils';
import type { ENV as e2 } from '@paima/batcher-utils';
import type { PaimaEvent } from './events.js';

/*
 * This class provides a PaimaEventPublisher Singleton.
 */
export class PaimaEventPublisher<T extends Record<string, any>> {
  constructor(
    private event: PaimaEvent<T>,
    private env: typeof e1 | typeof e2
  ) {}

  public sendMessage(message: T): void {
    const client = new PaimaEventConnect(this.env).getClient(this.event.broker);
    client.publish(this.event.getTopic(), JSON.stringify(message));
  }
}
