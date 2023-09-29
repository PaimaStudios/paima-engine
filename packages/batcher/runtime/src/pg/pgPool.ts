import pg from 'pg';
import { ENV } from '@paima/batcher-utils';
/**
 * Pool of Postgres connections to avoid overhead of connecting on every request.
 */

export const creds = {
  host: ENV.BATCHER_DB_HOST,
  user: ENV.BATCHER_DB_USER,
  password: ENV.BATCHER_DB_PW,
  database: ENV.BATCHER_DB_NAME,
  port: ENV.BATCHER_DB_PORT,
};

export function initializePool(): pg.Pool {
  const pool = new pg.Pool(creds);
  // Don't let a pg restart kill the app
  pool.on('error', err => console.log('Postgres pool error:', err));

  pool.on('connect', (_client: pg.PoolClient) => {
    // On each new client initiated, need to register for error(this is a serious bug on pg, the client throw errors although it should not)
    _client.on('error', (err: Error) => {
      console.log('Postgres pool error:', err);
    });
  });

  return pool;
}
