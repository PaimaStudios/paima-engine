import { tx } from './pg-tx';
import { getConnection } from './pg-connection.js';
import { createScheduledData, deleteScheduledData } from './scheduled-constructors';
import { initializePaimaTables } from './database-validation';

import {
  getLatestProcessedBlockHeight,
  getBlockHeight,
  getBlockSeeds,
  saveLastBlockHeight,
  blockHeightDone,
} from './sql/block-heights.queries';
import { deleteScheduled, getScheduledDataByBlockHeight } from './sql/scheduled.queries';
import { findNonce, insertNonce, deleteNonces } from './sql/nonces.queries';
import { storeGameInput } from './sql/historical.queries';

export * from './types';

export {
  tx,
  getConnection,
  createScheduledData,
  deleteScheduledData,
  initializePaimaTables,
  getLatestProcessedBlockHeight,
  getBlockHeight,
  getBlockSeeds,
  saveLastBlockHeight,
  blockHeightDone,
  deleteScheduled,
  getScheduledDataByBlockHeight,
  findNonce,
  insertNonce,
  deleteNonces,
  storeGameInput,
};
