import type { VersionString } from './types/index.js';

/**
 * Careful: this class uses `process.env`
 * which might not be set depending on the framework used for the frontend of an app
 */
export class ENV {
  static doHealthCheck(): void {}

  // System
  static get NETWORK(): string {
    return process.env.NETWORK || 'localhost';
  }

  static get POLLING_RATE_MS(): undefined | number {
    return process.env.POLLING_RATE != null ? parseFloat(process.env.POLLING_RATE) : undefined;
  }

  // TODO: this should be a config feature
  static get EMULATED_BLOCKS(): boolean {
    return ENV.isTrue(process.env.EMULATED_BLOCKS);
  }
  static get EMULATED_BLOCKS_MAX_WAIT(): number {
    // 20 seconds is just picked as a large value that is most likely safe as a default
    // it's too long for a good UX, but it's also least likely to cause a crash
    // if somebody knows they can safely set a smaller value, they can just override the default
    return parseFloat(process.env.EMULATED_BLOCKS_MAX_WAIT || '20');
  }

  // Security
  static get SECURITY_NAMESPACE(): string {
    return process.env.SECURITY_NAMESPACE || 'CONTRACT_ADDRESS';
  }
  static get RECAPTCHA_V3_FRONTEND(): string {
    return process.env.RECAPTCHA_V3_FRONTEND || '';
  }

  // TODO: remove these
  static get DEFAULT_FEE(): string {
    return process.env.DEFAULT_FEE || '100000000000000';
  }
  static get START_BLOCKHEIGHT(): number {
    return parseInt(process.env.START_BLOCKHEIGHT || '0', 10);
  }
  static get SM_START_BLOCKHEIGHT(): number {
    return this.EMULATED_BLOCKS ? 0 : ENV.START_BLOCKHEIGHT;
  }
  static get STOP_BLOCKHEIGHT(): number | null {
    return process.env.STOP_BLOCKHEIGHT ? parseInt(process.env.STOP_BLOCKHEIGHT) : null;
  }

  // Game node config:
  static get GAME_NODE_VERSION(): VersionString {
    return '1.0.0';
  }
  static get SERVER_ONLY_MODE(): boolean {
    return ENV.isTrue(process.env.SERVER_ONLY_MODE);
  }
  static get FORCE_INVALID_PAIMA_DB_TABLE_DELETION(): boolean {
    return ENV.isTrue(process.env.FORCE_INVALID_PAIMA_DB_TABLE_DELETION);
  }
  static get STORE_HISTORICAL_GAME_INPUTS(): boolean {
    return ENV.isTrue(process.env.STORE_HISTORICAL_GAME_INPUTS, true);
  }
  static get ENABLE_DRY_RUN(): boolean {
    return ENV.isTrue(process.env.ENABLE_DRY_RUN);
  }

  // Middleware config:
  static get BACKEND_URI(): string {
    return process.env.BACKEND_URI || '';
  }
  static get BATCHER_URI(): string {
    if (process.env.BATCHER_URI) {
      return process.env.BATCHER_URI;
    }
    if (ENV.NETWORK === 'localhost' && process.env.BATCHER_PORT) {
      return `http://localhost:${process.env.BATCHER_PORT}`;
    }
    return '';
  }

  // MQTT BROKER
  static get MQTT_BROKER(): boolean {
    return ENV.isTrue(process.env.MQTT_BROKER, true);
  }
  static get MQTT_ENGINE_BROKER_PORT(): number {
    return parseInt(process.env.MQTT_BROKER_PORT || '8883', 10);
  }
  static get MQTT_BATCHER_BROKER_PORT(): number {
    return parseInt(process.env.MQTT_BROKER_PORT || '8884', 10);
  }
  // MQTT CLIENT
  static get MQTT_ENGINE_BROKER_URL(): string {
    return process.env.MQTT_ENGINE_BROKER_URL || 'ws://127.0.0.1:' + ENV.MQTT_ENGINE_BROKER_PORT;
  }
  static get MQTT_BATCHER_BROKER_URL(): string {
    return process.env.MQTT_BATCHER_BROKER_URL || 'ws://127.0.0.1:' + ENV.MQTT_BATCHER_BROKER_PORT;
  }

  static get GET_LOGS_MAX_BLOCK_RANGE(): number {
    return parseFloat(process.env.GET_LOGS_MAX_BLOCK_RANGE || '5000');
  }

  // Utils
  private static isTrue(value: string | undefined, defaultValue = false): boolean {
    if (value == null || value === '') return defaultValue;
    return ['true', '1', 'yes'].includes(value.toLowerCase());
  }
}
