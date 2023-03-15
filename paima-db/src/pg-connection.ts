import type { PoolClient, PoolConfig } from 'pg';
import pg from 'pg';

import { logError } from '@paima/utils';

let readonlyDBConn: pg.Pool | null;

export const getConnection = (creds: PoolConfig, readonly = false): pg.Pool => {
  if (readonly && readonlyDBConn) return readonlyDBConn;

  const pool = new pg.Pool(creds);
  pool.on('error', err => logError(err));
  pool.on('connect', (_client: PoolClient) => {
    // On each new client initiated, need to register for error(this is a serious bug on pg, the client throw errors although it should not)
    _client.on('error', (err: Error) => {
      logError(err);
    });
  });

  if (readonly) {
    const ensureReadOnly = `SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY;`;
    void pool.query(ensureReadOnly); // note: this query modifies the DB state
    readonlyDBConn = pool;
  }

  return pool;
};
