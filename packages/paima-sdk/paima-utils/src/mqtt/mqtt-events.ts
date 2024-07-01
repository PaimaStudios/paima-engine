export class MQTTEvent {
  constructor(
    public name: string,
    public broker: 'paima-engine' | 'batcher',
    public path:
      | { type: 'exact'; fullPath: string }
      | { type: 'dynamic'; fullPath: string; commonPath: string },
    public callback: ((event: MQTTEvent, data: Record<string, unknown>) => void) | undefined
  ) {}

  public match(broker: string, path: string): boolean {
    if (this.broker !== broker) return false;
    if (this.path.type === 'exact' && this.path.fullPath === path) return true;
    if (this.path.type === 'dynamic' && path.startsWith(this.path.commonPath)) return true;
    return false;
  }
}

export enum MQTTSystemEventsNames {
  STF_GLOBAL = 'STF_GLOBAL',
  BATCHER_HASH_GLOBAL = 'BATCHER_HASH_GLOBAL',
  BATCHER_HASH_$ADDRESS = 'BATCHER_HASH_$ADDRESS',
}

export function newMQTTSystemEvent(
  eventName: MQTTSystemEventsNames,
  callback: ((event: MQTTEvent, data: Record<string, unknown>) => void) | undefined,
  ...args: string[]
): MQTTEvent {
  switch (eventName) {
    case MQTTSystemEventsNames.STF_GLOBAL:
      return new MQTTEvent(
        MQTTSystemEventsNames.STF_GLOBAL,
        'paima-engine',
        { type: 'exact', fullPath: '/sys/stf' },
        callback
      );
    case MQTTSystemEventsNames.BATCHER_HASH_GLOBAL:
      return new MQTTEvent(
        MQTTSystemEventsNames.BATCHER_HASH_GLOBAL,
        'batcher',
        { type: 'exact', fullPath: `/sys/batch_hash` },
        callback
      );
    case MQTTSystemEventsNames.BATCHER_HASH_$ADDRESS:
      return new MQTTEvent(
        MQTTSystemEventsNames.BATCHER_HASH_$ADDRESS,
        'batcher',
        { type: 'dynamic', fullPath: `/sys/batch_hash/${args[0]}`, commonPath: `/sys/batch_hash/` },
        callback
      );
  }
}
