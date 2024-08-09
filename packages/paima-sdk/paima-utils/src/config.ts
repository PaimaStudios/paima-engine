import type { VersionString } from './types';
import { config } from 'dotenv';

// https://github.com/flexdinesh/browser-or-node/blob/master/src/index.ts
const isNode: boolean =
  typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
if (isNode) {
  // for browser builds, we can't actually loads things from disk like this
  // instead, for browsers we rely on bundlers like Vite or Webpack to fill these
  config({ path: `${process.cwd()}/.env.${process.env.NETWORK || 'localhost'}` });
}

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

  // Target Blockchain:
  static get CHAIN_URI(): string {
    return process.env.CHAIN_URI || '';
  }
  static get CHAIN_NAME(): string {
    return process.env.CHAIN_NAME || 'UNKNOWN_CHAIN_NAME';
  }
  static get CHAIN_ID(): number {
    return parseInt(process.env.CHAIN_ID || '0', 10);
  }
  static get CHAIN_EXPLORER_URI(): string {
    return process.env.CHAIN_EXPLORER_URI || '';
  }
  static get CHAIN_CURRENCY_NAME(): string {
    return process.env.CHAIN_CURRENCY_NAME || 'UNKNOWN_CURRENCY_NAME';
  }
  static get CHAIN_CURRENCY_SYMBOL(): string {
    return process.env.CHAIN_CURRENCY_SYMBOL || 'NONAME';
  }
  static get CHAIN_CURRENCY_DECIMALS(): number {
    return parseInt(process.env.CHAIN_CURRENCY_DECIMALS || '0', 10);
  }
  static get BLOCK_TIME(): number {
    return parseFloat(process.env.BLOCK_TIME || '4');
  }
  static get POLLING_RATE(): number {
    return parseFloat(process.env.POLLING_RATE || `${ENV.BLOCK_TIME - 0.1}`);
  }
  static get DEPLOYMENT(): string {
    return process.env.DEPLOYMENT || '';
  }
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

  // PaimaL2Contract:
  static get CONTRACT_ADDRESS(): string {
    return process.env.CONTRACT_ADDRESS || process.env.STORAGE_ADDRESS || '';
  }
  static get DEFAULT_FEE(): string {
    return process.env.DEFAULT_FEE || '100000000000000';
  }

  // Game node config:
  static get GAME_NODE_VERSION(): VersionString {
    return '1.0.0';
  }
  static get START_BLOCKHEIGHT(): number {
    return parseInt(process.env.START_BLOCKHEIGHT || '0', 10);
  }
  static get SM_START_BLOCKHEIGHT(): number {
    return this.EMULATED_BLOCKS ? 0 : ENV.START_BLOCKHEIGHT;
  }
  static get DEFAULT_FUNNEL_GROUP_SIZE(): number {
    return parseInt(process.env.DEFAULT_FUNNEL_GROUP_SIZE || '100', 10);
  }
  static get DEFAULT_PRESYNC_STEP_SIZE(): number {
    return parseInt(process.env.DEFAULT_PRESYNC_STEP_SIZE || '1000', 10);
  }
  static get SERVER_ONLY_MODE(): boolean {
    return ENV.isTrue(process.env.SERVER_ONLY_MODE);
  }
  static get STOP_BLOCKHEIGHT(): number | null {
    return process.env.STOP_BLOCKHEIGHT ? parseInt(process.env.STOP_BLOCKHEIGHT) : null;
  }
  static get FORCE_INVALID_PAIMA_DB_TABLE_DELETION(): boolean {
    return ENV.isTrue(process.env.FORCE_INVALID_PAIMA_DB_TABLE_DELETION);
  }
  static get STORE_HISTORICAL_GAME_INPUTS(): boolean {
    return ENV.isTrue(process.env.STORE_HISTORICAL_GAME_INPUTS, true);
  }
  static get CDE_CONFIG_PATH(): string {
    return process.env.CDE_CONFIG_PATH || `extensions.${ENV.NETWORK}.yml`;
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

  static get CARP_URL(): string | undefined {
    return process.env.CARP_URL;
  }
  static get CARDANO_NETWORK(): string | undefined {
    return process.env.CARDANO_NETWORK;
  }
  static get CARDANO_CONFIRMATION_DEPTH(): number | undefined {
    return Number(process.env.CARDANO_CONFIRMATION_DEPTH);
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

  // Utils
  private static isTrue(value: string | undefined, defaultValue = false): boolean {
    if (value == null || value === '') return defaultValue;
    return ['true', '1', 'yes'].includes(value.toLowerCase());
  }
}
