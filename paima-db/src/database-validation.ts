import { doLog } from '@paima/utils';
import type { Pool } from 'pg';
import { TABLES } from './paima-tables';
import { createTable, tableExists, tableIsValid } from './postgres-metadata';
import type { TableData } from './table-types';

export async function initializePaimaTables(pool: Pool, force: boolean = false): Promise<boolean> {
  const invalidTables: string[] = [];
  let noIssues: boolean = true;

  for (const table of TABLES) {
    try {
      const success = await processTable(pool, table, force);
      if (!success) {
        invalidTables.push(table.tableName);
      }
    } catch (err) {
      doLog(`Error while initializing ${table.tableName}: ${err}`);
      noIssues = false;
    }
  }

  if (!force && invalidTables.length > 0) {
    doLog('The following internal Paima tables were detected but have invalid structure:');
    for (const tableName of invalidTables) {
      doLog(` - ${tableName}`);
    }
    doLog(
      'Please remove these tables from your database or update them to conform with Paima requirements.'
    );
    doLog(
      'Alternatively, set FORCE_INVALID_PAIMA_DB_TABLE_DELETION="true" in your .env config file to force the runtime to automatically delete and re-create these tables. This might delete some of your data, so use at your own risk!'
    );
  }

  return noIssues;
}

async function processTable(pool: Pool, table: TableData, force: boolean): Promise<boolean> {
  const exists = await tableExists(pool, table.tableName);
  const isValid = exists && (await tableIsValid(pool, table));

  if (!exists) {
    return await createTable(pool, table);
  } else if (!isValid) {
    if (force) {
      return await createTable(pool, table);
    } else {
      return false;
    }
  }
  return true;
  // TODO: distinguish create error vs. (exists && !isValid && !force)?
}
