import type { VersionString } from './types';

export class ENV {
  static doHealthCheck(): void {
    if (!ENV.CONTRACT_ADDRESS) {
      throw new Error(`Please ensure your .env.${ENV.NODE_ENV} is properly filled out.`);
    }
  }

  // System
  static get NODE_ENV(): string {
    return process.env.NODE_ENV || 'development';
  }

  // Target Blockchain:
  static get CHAIN_URI(): string {
    return process.env.CHAIN_URI || '';
  }
  static get CHAIN_NAME(): string {
    return process.env.CHAIN_NAME || '';
  }
  static get CHAIN_ID(): number {
    return parseInt(process.env.CHAIN_ID || '0', 10);
  }
  static get CHAIN_EXPLORER_URI(): string {
    return process.env.CHAIN_EXPLORER_URI || '';
  }
  static get CHAIN_CURRENCY_NAME(): string {
    return process.env.CHAIN_CURRENCY_NAME || '';
  }
  static get CHAIN_CURRENCY_SYMBOL(): string {
    return process.env.CHAIN_CURRENCY_SYMBOL || '';
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
  static get DEFAULT_FUNNEL_GROUP_SIZE(): number {
    return parseInt(process.env.DEFAULT_FUNNEL_GROUP_SIZE || '100', 10);
  }
  static get DEFAULT_PRESYNC_STEP_SIZE(): number {
    return parseInt(process.env.DEFAULT_PRESYNC_STEP_SIZE || '1000', 10);
  }
  static get SERVER_ONLY_MODE(): boolean {
    return process.env.SERVER_ONLY_MODE === 'true';
  }
  static get STOP_BLOCKHEIGHT(): number | null {
    return process.env.STOP_BLOCKHEIGHT ? parseInt(process.env.STOP_BLOCKHEIGHT) : null;
  }
  static get FORCE_INVALID_PAIMA_DB_TABLE_DELETION(): boolean {
    return process.env.FORCE_INVALID_PAIMA_DB_TABLE_DELETION === 'true';
  }
  static get STORE_HISTORICAL_GAME_INPUTS(): boolean {
    return (process.env.STORE_HISTORICAL_GAME_INPUTS || 'true') === 'true';
  }
  static get CDE_CONFIG_PATH(): string {
    return process.env.CDE_CONFIG_PATH || 'extensions.yml';
  }
  static get DISABLE_DRY_RUN(): boolean {
    return process.env.DISABLE_DRY_RUN === 'true';
  }

  // Middleware config:
  static get BACKEND_URI(): string {
    return process.env.BACKEND_URI || '';
  }
  static get BATCHER_URI(): string {
    return process.env.BATCHER_URI || '';
  }
}
