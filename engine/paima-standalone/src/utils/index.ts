import { config } from 'dotenv';
import type { PoolConfig } from 'pg';

config({ path: `${process.cwd()}/.env.${process.env.NODE_ENV || 'development'}` });

export const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PW || '',
  database: process.env.DB_NAME || '',
  port: parseInt(process.env.DB_PORT || '5432', 10),
};
