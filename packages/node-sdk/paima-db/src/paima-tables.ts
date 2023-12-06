import type { TableData } from './table-types.js';
import { packTuples } from './table-types.js';

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

const QUERY_CREATE_TABLE_CDE_TRACKING = `
CREATE TABLE cde_tracking (
  block_height INTEGER PRIMARY KEY
);
`;

const TABLE_DATA_CDE_TRACKING: TableData = {
  tableName: 'cde_tracking',
  primaryKeyColumns: ['block_height'],
  columnData: packTuples([['block_height', 'integer', 'NO', '']]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_TRACKING,
};

const QUERY_CREATE_TABLE_CDE_TRACKING_CARDANO = `
CREATE TABLE cde_tracking_cardano (
  id INTEGER PRIMARY KEY,
  slot INTEGER NOT NULL
);
`;

const TABLE_DATA_CDE_TRACKING_CARDANO: TableData = {
  tableName: 'cde_tracking_cardano',
  primaryKeyColumns: ['id'],
  columnData: packTuples([
    ['id', 'integer', 'NO', ''],
    ['slot', 'integer', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_TRACKING_CARDANO,
};

const QUERY_CREATE_TABLE_CDE = `
CREATE TABLE chain_data_extensions (
  cde_id INTEGER PRIMARY KEY,
  cde_type INTEGER NOT NULL,
  cde_name TEXT NOT NULL,
  cde_hash integer NOT NULL,
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
    ['cde_name', 'text', 'NO', ''],
    ['cde_hash', 'integer', 'NO', ''],
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

const QUERY_CREATE_TABLE_CDE_ERC20_DEPOSIT = `
CREATE TABLE cde_erc20_deposit_data (
  cde_id INTEGER NOT NULL,
  wallet_address TEXT NOT NULL,
  total_deposited TEXT NOT NULL,
  PRIMARY KEY (cde_id, wallet_address)
);
`;

const TABLE_DATA_CDE_ERC20_DEPOSIT: TableData = {
  tableName: 'cde_erc20_deposit_data',
  primaryKeyColumns: ['cde_id', 'wallet_address'],
  columnData: packTuples([
    ['cde_id', 'integer', 'NO', ''],
    ['wallet_address', 'text', 'NO', ''],
    ['total_deposited', 'text', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_ERC20_DEPOSIT,
};

const QUERY_CREATE_TABLE_CDE_GENERIC_DATA = `
CREATE TABLE cde_generic_data (
  cde_id INTEGER NOT NULL,
  id SERIAL,
  block_height INTEGER NOT NULL,
  event_data JSON NOT NULL,
  PRIMARY KEY (cde_id, id)
);
`;

const TABLE_DATA_CDE_GENERIC_DATA: TableData = {
  tableName: 'cde_generic_data',
  primaryKeyColumns: ['cde_id', 'id'],
  columnData: packTuples([
    ['cde_id', 'integer', 'NO', ''],
    ['id', 'integer', 'NO', ''],
    ['block_height', 'integer', 'NO', ''],
    ['event_data', 'json', 'NO', ''],
  ]),
  serialColumns: ['id'],
  creationQuery: QUERY_CREATE_TABLE_CDE_GENERIC_DATA,
};

const QUERY_CREATE_TABLE_CDE_ERC6551_REGISTRY = `
CREATE TABLE cde_erc6551_registry_data (
  cde_id INTEGER NOT NULL,
  block_height INTEGER NOT NULL,
  account_created TEXT NOT NULL,
  implementation TEXT NOT NULL,
  token_contract TEXT NOT NULL,
  token_id TEXT NOT NULL,
  chain_id TEXT NOT NULL,
  salt TEXT NOT NULL,
  PRIMARY KEY (cde_id, account_created)
);
`;

const TABLE_DATA_CDE_ERC6551_REGISTRY: TableData = {
  tableName: 'cde_erc6551_registry_data',
  primaryKeyColumns: ['cde_id', 'account_created'],
  columnData: packTuples([
    ['cde_id', 'integer', 'NO', ''],
    ['block_height', 'integer', 'NO', ''],
    ['account_created', 'text', 'NO', ''],
    ['implementation', 'text', 'NO', ''],
    ['token_contract', 'text', 'NO', ''],
    ['token_id', 'text', 'NO', ''],
    ['chain_id', 'text', 'NO', ''],
    ['salt', 'text', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_ERC6551_REGISTRY,
};

const QUERY_CREATE_TABLE_CDE_CARDANO_POOL = `
CREATE TABLE cde_cardano_pool_delegation (
  cde_id INTEGER NOT NULL,
  epoch INTEGER NOT NULL,
  address TEXT NOT NULL,
  pool TEXT,
  PRIMARY KEY (cde_id, epoch, address)
);
`;

const TABLE_DATA_CDE_CARDANO_POOL: TableData = {
  tableName: 'cde_cardano_pool_delegation',
  primaryKeyColumns: ['cde_id', 'epoch', 'address'],
  columnData: packTuples([
    ['cde_id', 'integer', 'NO', ''],
    ['epoch', 'integer', 'NO', ''],
    ['address', 'text', 'NO', ''],
    ['pool', 'text', 'YES', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_CARDANO_POOL,
};

const QUERY_CREATE_TABLE_CDE_CARDANO_PROJECTED_NFT = `
CREATE TABLE cde_cardano_projected_nft (
  cde_id INTEGER NOT NULL,
  id SERIAL,
  owner_address TEXT NOT NULL,
  previous_tx_hash TEXT,
  previous_tx_output_index INTEGER,
  current_tx_hash TEXT NOT NULL,
  current_tx_output_index INTEGER,
  policy_id TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  amount BIGINT NOT NULL,
  status TEXT NOT NULL,
  plutus_datum TEXT NOT NULL,
  for_how_long BIGINT,
  PRIMARY KEY (cde_id, id)
)
`;

const TABLE_DATA_CDE_CARDANO_PROJECTED_NFT: TableData = {
  tableName: 'cde_cardano_projected_nft',
  primaryKeyColumns: ['cde_id', 'id'],
  columnData: packTuples([
    ['cde_id', 'integer', 'NO', ''],
    ['id', 'integer', 'NO', ''],
    ['owner_address', 'text', 'NO', ''],
    ['previous_tx_hash', 'text', 'YES', ''],
    ['previous_tx_output_index', 'integer', 'YES', ''],
    ['current_tx_hash', 'text', 'NO', ''],
    ['current_tx_output_index', 'integer', 'YES', ''],
    ['policy_id', 'text', 'NO', ''],
    ['asset_name', 'text', 'NO', ''],
    ['amount', 'bigint', 'NO', ''],
    ['status', 'text', 'NO', ''],
    ['plutus_datum', 'text', 'NO', ''],
    ['for_how_long', 'bigint', 'YES', ''],
  ]),
  serialColumns: ['id'],
  creationQuery: QUERY_CREATE_TABLE_CDE_CARDANO_PROJECTED_NFT,
};

const QUERY_CREATE_TABLE_CARDANO_LAST_EPOCH = `
CREATE TABLE cardano_last_epoch (
  id INTEGER PRIMARY KEY,
  epoch INTEGER NOT NULL
);
`;

const TABLE_DATA_CARDANO_LAST_EPOCH: TableData = {
  tableName: 'cardano_last_epoch',
  primaryKeyColumns: ['id'],
  columnData: packTuples([
    ['id', 'integer', 'NO', ''],
    ['epoch', 'integer', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CARDANO_LAST_EPOCH,
};

const QUERY_CREATE_TABLE_EMULATED = `
CREATE TABLE emulated_block_heights (
  deployment_chain_block_height INTEGER PRIMARY KEY,
  second_timestamp TEXT NOT NULL,
  emulated_block_height INTEGER NOT NULL
);
`;

const TABLE_DATA_EMULATED: TableData = {
  tableName: 'emulated_block_heights',
  primaryKeyColumns: ['deployment_chain_block_height'],
  columnData: packTuples([
    ['deployment_chain_block_height', 'integer', 'NO', ''],
    ['second_timestamp', 'text', 'NO', ''],
    ['emulated_block_height', 'integer', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_EMULATED,
};

export const TABLES: TableData[] = [
  TABLE_DATA_BLOCKHEIGHTS,
  TABLE_DATA_NONCES,
  TABLE_DATA_SCHEDULED,
  TABLE_DATA_HISTORICAL,
  TABLE_DATA_CDE_TRACKING,
  TABLE_DATA_CDE_TRACKING_CARDANO,
  TABLE_DATA_CDE,
  TABLE_DATA_CDE_ERC20,
  TABLE_DATA_CDE_ERC721,
  TABLE_DATA_CDE_ERC20_DEPOSIT,
  TABLE_DATA_CDE_GENERIC_DATA,
  TABLE_DATA_CDE_ERC6551_REGISTRY,
  TABLE_DATA_CDE_CARDANO_POOL,
  TABLE_DATA_CDE_CARDANO_PROJECTED_NFT,
  TABLE_DATA_EMULATED,
  TABLE_DATA_CARDANO_LAST_EPOCH,
];
