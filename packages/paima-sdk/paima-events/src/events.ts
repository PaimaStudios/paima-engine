import type { PaimaEventBrokerNames } from './event-utils.js';

/*
 * Base Event for Paima Events.
 * Extend this class to create custom events.
 */
export abstract class PaimaEvent<Message extends Record<string, unknown>> {
  constructor(
    public name: string,
    public broker: PaimaEventBrokerNames,
    public topic: string,
    public callback?: ((event: PaimaEvent<Message>, message: Message) => void) | undefined
  ) {}

  public match(broker: PaimaEventBrokerNames, topic: string): boolean {
    if (this.broker === broker && this.topic === topic) return true;
    return false;
  }

  public getTopic(): string {
    return this.topic
  }
}
