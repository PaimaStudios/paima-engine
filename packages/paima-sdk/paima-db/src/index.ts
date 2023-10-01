import { tx } from './pg-tx';
import { getConnection } from './pg-connection.js';
import { createScheduledData, deleteScheduledData } from './scheduled-constructors';
import { initializePaimaTables } from './database-validation';
import { DataMigrations } from './data-migrations';

export * from './sql/block-heights.queries';
export type * from './sql/block-heights.queries';
export * from './sql/scheduled.queries';
export type * from './sql/scheduled.queries';
export * from './sql/nonces.queries';
export type * from './sql/nonces.queries';
export * from './sql/historical.queries';
export type * from './sql/historical.queries';
export * from './sql/cde-tracking.queries';
export type * from './sql/cde-tracking.queries';
export * from './sql/extensions.queries';
export type * from './sql/extensions.queries';
// pgtyped keeps regenerating the Json type, so we can't just export * or we get conflicts:
export {
  getCdeConfigGeneric,
  getSpecificCdeConfigGeneric,
  registerCdeConfigGeneric,
} from './sql/cde-config-generic.queries';
export type * from './sql/cde-config-generic.queries';
export * from './sql/cde-config-erc20-deposit.queries';
export type * from './sql/cde-config-erc20-deposit.queries';
export * from './sql/cde-erc20.queries';
export type * from './sql/cde-erc20.queries';
export * from './sql/cde-erc721.queries';
export type * from './sql/cde-erc721.queries';
export * from './sql/cde-erc20-deposit.queries';
export type * from './sql/cde-erc20-deposit.queries';
export * from './sql/cde-generic.queries';
export type * from './sql/cde-generic.queries';
export * from './sql/emulated.queries';
export type * from './sql/emulated.queries';
export type * from './types';

export {
  tx,
  getConnection,
  createScheduledData,
  deleteScheduledData,
  initializePaimaTables,
  DataMigrations,
};
