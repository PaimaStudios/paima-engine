import type { Pool, PoolClient } from 'pg';
import txImport from 'pg-tx';

type TxType = <T>(
  pg: Pool | PoolClient,
  callback: (db: PoolClient) => Promise<T>,
  forceRollback?: boolean
) => Promise<T>;

export let tx: TxType;

if (txImport.hasOwnProperty('default')) {
  tx = (txImport as unknown as { default: TxType }).default;
} else {
  tx = txImport;
}
