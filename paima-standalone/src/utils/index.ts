import { config } from 'dotenv';
import type { PoolConfig } from 'pg';

// TODO: remove debug option
config({ path: `${process.cwd()}/.env.${process.env.NODE_ENV || 'development'}`, debug: true });

// TODO: incorporate other env variables from catapult (when needed)
export const gameBackendVersion = '1.1.1';

export const CHAIN_URI = process.env.CHAIN_URI || '';

export const STORAGE_ADDRESS = process.env.STORAGE_ADDRESS || '';
export const START_BLOCKHEIGHT = parseInt(process.env.START_BLOCKHEIGHT || '0');
export const SERVER_ONLY_MODE = process.env.SERVER_ONLY_MODE == 'true';
export const STOP_BLOCKHEIGHT = process.env.STOP_BLOCKHEIGHT
  ? parseInt(process.env.STOP_BLOCKHEIGHT)
  : null;

export const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PW || '',
  database: process.env.DB_NAME || '',
  port: parseInt(process.env.DB_PORT || '5432', 10),
};
