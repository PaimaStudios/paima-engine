import { doLog } from '@paima/utils';
import type { Pool } from 'pg';

import type { ColumnData, TableData } from './table-types';

const QUERY_TABLE_EXISTENCE = 'SELECT * FROM pg_tables WHERE tablename = $1';
const QUERY_TABLE_COLUMN =
  'SELECT * FROM information_schema.columns WHERE table_name = $1 AND column_name = $2';
const QUERY_COLUMN_SERIAL = 'SELECT * FROM information_schema.sequences WHERE sequence_name = $1';
const QUERY_TABLE_CONSTRAINTS = `
SELECT * FROM information_schema.constraint_column_usage
WHERE table_name = $1 AND column_name = $2 AND constraint_name = $3
`;

export async function tableExists(pool: Pool, tableName: string): Promise<boolean> {
  const res = await pool.query(QUERY_TABLE_EXISTENCE, [tableName]);
  return res.rows.length > 0;
}

export async function tableIsValid(pool: Pool, table: TableData): Promise<boolean> {
  const { tableName, primaryKeyColumns, columnData, serialColumns } = table;

  for (const primaryKeyColumn of primaryKeyColumns) {
    if (!(await checkTablePkey(pool, tableName, primaryKeyColumn))) {
      doLog(`[database-validation] table ${tableName} failing on primary key column ${primaryKeyColumn}`);
      return false;
    }
  }
  if (!(await checkAllTableColumns(pool, tableName, columnData))) {
    doLog(`[database-validation] table ${tableName} failing on columns`);
    return false;
  }
  for (const serialColumn of serialColumns) {
    if (!(await tableColumnSerial(pool, tableName, serialColumn))) {
      doLog(`[database-validation] table ${tableName} failing on serial column ${serialColumn}`);
      return false;
    }
  }
  return true;
}

export async function createTable(pool: Pool, table: TableData): Promise<boolean> {
  try {
    await pool.query(`DROP TABLE ${table.tableName}`);
  } catch (err) {
    // pass -- we don't care about errors while deleting as long as creation goes through fine
  }

  try {
    await pool.query(table.creationQuery);
  } catch (err) {
    doLog(`[database-validation] Error while creating table: ${err}`);
    return false;
  }

  return true;
}

async function checkTablePkey(pool: Pool, tableName: string, columnName: string): Promise<boolean> {
  const pkeyConstraint = `${tableName}_pkey`;
  const res = await pool.query(QUERY_TABLE_CONSTRAINTS, [tableName, columnName, pkeyConstraint]);
  return res.rows.length > 0;
}

async function tableColumnSerial(
  pool: Pool,
  tableName: string,
  columnName: string
): Promise<boolean> {
  const sequenceName = `${tableName}_${columnName}_seq`;
  const res = await pool.query(QUERY_COLUMN_SERIAL, [sequenceName]);
  return res.rows.length > 0;
}

async function checkAllTableColumns(
  pool: Pool,
  tableName: string,
  columnData: ColumnData[]
): Promise<boolean> {
  const promises = columnData.map(column => checkTableColumn(pool, tableName, column));
  const results = await Promise.all(promises);
  return results.every(res => res);
}

async function checkTableColumn(
  pool: Pool,
  tableName: string,
  column: ColumnData
): Promise<boolean> {
  const res = await pool.query(QUERY_TABLE_COLUMN, [tableName, column.columnName]);
  if (res.rows.length === 0) {
    return false;
  }

  const row = res.rows[0];

  const flagDefault = !column.defaultValue || row.column_default === column.defaultValue;
  const flagType = row.data_type === column.columnType;
  const flagNullable = row.is_nullable === column.columnNullable;

  const result = flagDefault && flagType && flagNullable;
  if (!result) {
  }
  return result;
}
