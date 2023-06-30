import { tx } from './pg-tx';
import { getConnection } from './pg-connection.js';
import { createScheduledData, deleteScheduledData } from './scheduled-constructors';
import { initializePaimaTables } from './database-validation';
import { DataMigrations } from './data-migrations';
import type { SQLUpdate } from './types';

export * from './sql/block-heights.queries';
export * from './sql/scheduled.queries';
export * from './sql/nonces.queries';
export * from './sql/historical.queries';
export * from './sql/cde-tracking.queries';
export * from './sql/extensions.queries';
// pgtyped keeps regenerating the Json type, so we can't just export * or we get conflicts:
export {
  getCdeConfigGeneric,
  getSpecificCdeConfigGeneric,
  registerCdeConfigGeneric,
} from './sql/cde-config-generic.queries';
export * from './sql/cde-config-erc20-deposit.queries';
export * from './sql/cde-erc20.queries';
export * from './sql/cde-erc721.queries';
export * from './sql/cde-erc20-deposit.queries';
export * from './sql/cde-generic.queries';

export {
  tx,
  getConnection,
  createScheduledData,
  deleteScheduledData,
  initializePaimaTables,
  DataMigrations,
  SQLUpdate,
};
