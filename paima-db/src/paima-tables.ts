import type { TableData } from './table-types';
import { packTuples } from './table-types';

const QUERY_CREATE_TABLE_BLOCKHEIGHTS = `
CREATE TABLE block_heights ( 
  block_height INTEGER PRIMARY KEY,
  seed TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false
);
`;

const TABLE_DATA_BLOCKHEIGHTS: TableData = {
  tableName: 'block_heights',
  primaryKeyColumns: ['block_height'],
  columnData: packTuples([
    ['block_height', 'integer', 'NO', ''],
    ['seed', 'text', 'NO', ''],
    ['done', 'boolean', 'NO', 'false'],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_BLOCKHEIGHTS,
};

const QUERY_CREATE_TABLE_NONCES = `
CREATE TABLE nonces (
  nonce TEXT PRIMARY KEY,
  block_height INTEGER NOT NULL
);
`;

const TABLE_DATA_NONCES: TableData = {
  tableName: 'nonces',
  primaryKeyColumns: ['nonce'],
  columnData: packTuples([
    ['nonce', 'text', 'NO', ''],
    ['block_height', 'integer', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_NONCES,
};

const QUERY_CREATE_TABLE_SCHEDULED = `
CREATE TABLE scheduled_data (
  id SERIAL PRIMARY KEY,
  block_height INTEGER NOT NULL,
  input_data TEXT NOT NULL
);
`;

const TABLE_DATA_SCHEDULED: TableData = {
  tableName: 'scheduled_data',
  primaryKeyColumns: ['id'],
  columnData: packTuples([
    ['id', 'integer', 'NO', ''],
    ['block_height', 'integer', 'NO', ''],
    ['input_data', 'text', 'NO', ''],
  ]),
  serialColumns: ['id'],
  creationQuery: QUERY_CREATE_TABLE_SCHEDULED,
};

const QUERY_CREATE_TABLE_HISTORICAL = `
CREATE TABLE historical_game_inputs (
  id SERIAL PRIMARY KEY,
  block_height INTEGER NOT NULL,
  user_address TEXT NOT NULL,
  input_data TEXT NOT NULL
);
`;

const TABLE_DATA_HISTORICAL: TableData = {
  tableName: 'historical_game_inputs',
  primaryKeyColumns: ['id'],
  columnData: packTuples([
    ['id', 'integer', 'NO', ''],
    ['block_height', 'integer', 'NO', ''],
    ['user_address', 'text', 'NO', ''],
    ['input_data', 'text', 'NO', ''],
  ]),
  serialColumns: ['id'],
  creationQuery: QUERY_CREATE_TABLE_HISTORICAL,
};

const QUERY_CREATE_TABLE_PRESYNC = `
CREATE TABLE presync_block_heights (
  block_height INTEGER PRIMARY KEY,
  done BOOLEAN NOT NULL DEFAULT false
);
`;

const TABLE_DATA_PRESYNC: TableData = {
  tableName: 'presync_block_heights',
  primaryKeyColumns: ['block_height'],
  columnData: packTuples([
    ['block_height', 'integer', 'NO', ''],
    ['done', 'boolean', 'NO', 'false'],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_PRESYNC,
};

const QUERY_CREATE_TABLE_CDE = `
CREATE TABLE chain_data_extensions (
  cde_id INTEGER PRIMARY KEY,
  cde_type INTEGER NOT NULL,
  contract_address TEXT NOT NULL,
  start_blockheight INTEGER NOT NULL,
  scheduled_prefix TEXT
);
`;

const TABLE_DATA_CDE: TableData = {
  tableName: 'chain_data_extensions',
  primaryKeyColumns: ['cde_id'],
  columnData: packTuples([
    ['cde_id', 'integer', 'NO', ''],
    ['cde_type', 'integer', 'NO', ''],
    ['contract_address', 'text', 'NO', ''],
    ['start_blockheight', 'integer', 'NO', ''],
    ['scheduled_prefix', 'text', 'YES', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE,
};

const QUERY_CREATE_TABLE_CDE_ERC20 = `
CREATE TABLE cde_erc20_data (
  cde_id INTEGER NOT NULL,
  wallet_address TEXT NOT NULL,
  balance TEXT NOT NULL,
  PRIMARY KEY (cde_id, wallet_address)
);
`;

const TABLE_DATA_CDE_ERC20: TableData = {
  tableName: 'cde_erc20_data',
  primaryKeyColumns: ['cde_id', 'wallet_address'],
  columnData: packTuples([
    ['cde_id', 'integer', 'NO', ''],
    ['wallet_address', 'text', 'NO', ''],
    ['balance', 'text', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_ERC20,
};

const QUERY_CREATE_TABLE_CDE_ERC721 = `
CREATE TABLE cde_erc721_data (
  cde_id INTEGER NOT NULL,
  token_id TEXT NOT NULL,
  nft_owner TEXT NOT NULL,
  PRIMARY KEY (cde_id, token_id)
);
`;

const TABLE_DATA_CDE_ERC721: TableData = {
  tableName: 'cde_erc721_data',
  primaryKeyColumns: ['cde_id', 'token_id'],
  columnData: packTuples([
    ['cde_id', 'integer', 'NO', ''],
    ['token_id', 'text', 'NO', ''],
    ['nft_owner', 'text', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_ERC721,
};

export const TABLES: TableData[] = [
  TABLE_DATA_BLOCKHEIGHTS,
  TABLE_DATA_NONCES,
  TABLE_DATA_SCHEDULED,
  TABLE_DATA_HISTORICAL,
  TABLE_DATA_PRESYNC,
  TABLE_DATA_CDE,
  TABLE_DATA_CDE_ERC20,
  TABLE_DATA_CDE_ERC721,
];
