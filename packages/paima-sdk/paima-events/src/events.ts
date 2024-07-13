import type { PaimaEventBrokerNames } from './event-utils.js';

export class PaimaEvent<Message extends Record<string, unknown>> {
  constructor(
    public name: string,
    public broker: PaimaEventBrokerNames,
    public path:
      | { type: 'exact'; fullPath: string }
      | { type: 'dynamic'; fullPath: string; commonPath: string },
    public callback: ((event: PaimaEvent<Message>, message: Message) => void) | undefined
  ) {}

  public match(broker: PaimaEventBrokerNames, path: string): boolean {
    if (this.broker !== broker) return false;
    if (this.path.type === 'exact' && this.path.fullPath === path) return true;
    if (this.path.type === 'dynamic' && path.startsWith(this.path.commonPath)) return true;
    return false;
  }

  public getTopic(): string {
    return this.path.fullPath;
  }
}
