import type { TableData } from './table-types';
import { packTuples } from './table-types';

const QUERY_CREATE_TABLE_BLOCKHEIGHTS = `
CREATE TABLE block_heights ( 
    block_height INTEGER PRIMARY KEY,
    seed TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT false
);
`;
const QUERY_CREATE_TABLE_NONCES = `
CREATE TABLE nonces (
    nonce TEXT PRIMARY KEY,
    block_height INTEGER NOT NULL
);
`;

const QUERY_CREATE_TABLE_SCHEDULED = `
CREATE TABLE scheduled_data (
    id SERIAL PRIMARY KEY,
    block_height INTEGER NOT NULL,
    input_data TEXT NOT NULL
);
`;

const TABLE_DATA_BLOCKHEIGHTS: TableData = {
  tableName: 'block_heights',
  primaryKey: 'block_height',
  columnData: packTuples([
    ['block_height', 'integer', 'NO', ''],
    ['seed', 'text', 'NO', ''],
    ['done', 'boolean', 'NO', 'false'],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_BLOCKHEIGHTS,
};

const TABLE_DATA_NONCES: TableData = {
  tableName: 'nonces',
  primaryKey: 'nonce',
  columnData: packTuples([
    ['nonce', 'text', 'NO', ''],
    ['block_height', 'integer', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_NONCES,
};

const TABLE_DATA_SCHEDULED = {
  tableName: 'scheduled_data',
  primaryKey: 'id',
  columnData: packTuples([
    ['id', 'integer', 'NO', ''],
    ['block_height', 'integer', 'NO', ''],
    ['input_data', 'text', 'NO', ''],
  ]),
  serialColumns: ['id'],
  creationQuery: QUERY_CREATE_TABLE_SCHEDULED,
};

export const TABLES: TableData[] = [
  TABLE_DATA_BLOCKHEIGHTS,
  TABLE_DATA_NONCES,
  TABLE_DATA_SCHEDULED,
];
