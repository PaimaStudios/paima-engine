import { tx } from './pg-tx';
import { getConnection } from './pg-connection.js';
import { createScheduledData, deleteScheduledData } from './scheduled-constructors';
import { initializePaimaTables } from './database-validation';

import {
  blockHeightDone,
  getLatestBlockHeight,
  saveLastBlockHeight,
  getBlockSeeds,
} from './sql/block-heights.queries';
import { deleteScheduled, getScheduledDataByBlockHeight } from './sql/scheduled.queries';
import { findNonce, insertNonce } from './sql/nonces.queries';
import { storeGameInput } from './sql/historical.queries';

export * from './types';

export {
  tx,
  getConnection,
  createScheduledData,
  deleteScheduledData,
  initializePaimaTables,
  blockHeightDone,
  getLatestBlockHeight,
  saveLastBlockHeight,
  getBlockSeeds,
  deleteScheduled,
  getScheduledDataByBlockHeight,
  findNonce,
  insertNonce,
  storeGameInput,
};
