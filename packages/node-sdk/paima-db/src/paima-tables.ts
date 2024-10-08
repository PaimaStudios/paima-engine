import type { TableData } from './table-types.js';
import { packTuples } from './table-types.js';

const QUERY_CREATE_TABLE_BLOCKHEIGHTS = `
CREATE TABLE paima_blocks (
  block_height INTEGER PRIMARY KEY,
  ver INTEGER NOT NULL,
  main_chain_block_hash BYTEA NOT NULL,
  seed TEXT NOT NULL,
  ms_timestamp TIMESTAMP without time zone NOT NULL,
  paima_block_hash BYTEA
);
`;

const QUERY_CREATE_INDEX_PAIMA_BLOCK_HASH = `
CREATE INDEX PAIMA_BLOCKS_L2_HASH_INDEX ON "paima_blocks" (paima_block_hash);
`;
const QUERY_CREATE_INDEX_MAIN_BLOCK_HASH = `
CREATE INDEX PAIMA_BLOCKS_L1_HASH_INDEX ON "paima_blocks" (main_chain_block_hash);
`;

const TABLE_DATA_PAIMA_BLOCKS: TableData = {
  tableName: 'paima_blocks',
  primaryKeyColumns: ['block_height'],
  columnData: packTuples([
    ['block_height', 'integer', 'NO', ''],
    ['ver', 'integer', 'NO', ''],
    ['main_chain_block_hash', 'bytea', 'NO', ''],
    ['seed', 'text', 'NO', ''],
    ['ms_timestamp', 'timestamp without time zone', 'NO', ''],
    ['paima_block_hash', 'bytea', 'YES', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_BLOCKHEIGHTS,
  index: [
    {
      name: 'PAIMA_BLOCKS_L2_HASH_INDEX',
      creationQuery: QUERY_CREATE_INDEX_PAIMA_BLOCK_HASH,
    },
    {
      name: 'PAIMA_BLOCKS_L1_HASH_INDEX',
      creationQuery: QUERY_CREATE_INDEX_MAIN_BLOCK_HASH,
    },
  ],
  // TODO: we could also create a constraint
  //       that paima_block_hash is non-null after each db query
  //       CONSTRAINT hash_not_null CHECK (paima_block_hash IS NOT NULL) DEFERRABLE INITIALLY DEFERRED
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

const QUERY_CREATE_INDEX_ROLLUP_INPUT_RESULT_TX_HASH = `
CREATE INDEX QUERY_CREATE_INDEX_ROLLUP_INPUT_RESULT_TX_HASH ON "rollup_input_result" (paima_tx_hash);
`;
const QUERY_CREATE_INDEX_ROLLUP_INPUTS_RESULT_BLOCK_HEIGHT = `
CREATE INDEX QUERY_CREATE_INDEX_ROLLUP_INPUTS_RESULT_BLOCK_HEIGHT ON "rollup_input_result" (block_height);
`;

const QUERY_CREATE_TABLE_ROLLUP_INPUT_RESULT = `
CREATE TABLE rollup_input_result (
  id INTEGER PRIMARY KEY REFERENCES rollup_inputs(id) ON DELETE CASCADE,
  success BOOLEAN NOT NULL,
  paima_tx_hash BYTEA NOT NULL,
  block_height INTEGER NOT NULL REFERENCES paima_blocks(block_height),
  index_in_block INTEGER NOT NULL
);
`;

const TABLE_DATA_ROLLUP_INPUT_RESULT: TableData = {
  tableName: 'rollup_input_result',
  primaryKeyColumns: ['id'],
  columnData: packTuples([
    ['id', 'integer', 'NO', ''],
    ['success', 'boolean', 'NO', ''],
    ['paima_tx_hash', 'bytea', 'NO', ''],
    ['index_in_block', 'integer', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_ROLLUP_INPUT_RESULT,
  index: [
    {
      name: 'QUERY_CREATE_INDEX_ROLLUP_INPUT_RESULT_TX_HASH',
      creationQuery: QUERY_CREATE_INDEX_ROLLUP_INPUT_RESULT_TX_HASH,
    },
    {
      name: 'QUERY_CREATE_INDEX_ROLLUP_INPUTS_RESULT_BLOCK_HEIGHT',
      creationQuery: QUERY_CREATE_INDEX_ROLLUP_INPUTS_RESULT_BLOCK_HEIGHT,
    },
  ],
};

const QUERY_CREATE_INDEX_ROLLUP_INPUT_FUTURE_BLOCK_BLOCK_HEIGHT = `
CREATE INDEX QUERY_CREATE_INDEX_ROLLUP_INPUT_FUTURE_BLOCK_BLOCK_HEIGHT ON "rollup_input_future_block" (future_block_height);
`;

const QUERY_CREATE_ROLLUP_INPUT_FUTURE_BLOCK = `
CREATE TABLE rollup_input_future_block (
  id INTEGER PRIMARY KEY REFERENCES rollup_inputs(id) ON DELETE CASCADE,
  future_block_height INTEGER NOT NULL
);
`;

const TABLE_DATA_ROLLUP_INPUT_FUTURE_BLOCK: TableData = {
  tableName: 'rollup_input_future_block',
  primaryKeyColumns: ['id'],
  columnData: packTuples([
    ['id', 'integer', 'NO', ''],
    ['future_block_height', 'integer', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_ROLLUP_INPUT_FUTURE_BLOCK,
  index: [
    {
      name: 'QUERY_CREATE_INDEX_ROLLUP_INPUT_FUTURE_BLOCK_BLOCK_HEIGHT',
      creationQuery: QUERY_CREATE_INDEX_ROLLUP_INPUT_FUTURE_BLOCK_BLOCK_HEIGHT,
    },
  ],
};

const QUERY_CREATE_INDEX_ROLLUP_INPUT_FUTURE_TIMESTAMP_BLOCK_HEIGHT = `
CREATE INDEX QUERY_CREATE_INDEX_ROLLUP_INPUT_FUTURE_TIMESTAMP_BLOCK_HEIGHT ON "rollup_input_future_timestamp" (future_ms_timestamp);
`;

const QUERY_CREATE_ROLLUP_INPUT_FUTURE_TIMESTAMP = `
CREATE TABLE rollup_input_future_timestamp (
  id INTEGER PRIMARY KEY REFERENCES rollup_inputs(id) ON DELETE CASCADE,
  future_ms_timestamp TIMESTAMP without time zone NOT NULL
);
`;

const TABLE_DATA_ROLLUP_INPUT_FUTURE_TIMESTAMP: TableData = {
  tableName: 'rollup_input_future_timestamp',
  primaryKeyColumns: ['id'],
  columnData: packTuples([
    ['id', 'integer', 'NO', ''],
    ['future_ms_timestamp', 'timestamp without time zone', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_ROLLUP_INPUT_FUTURE_TIMESTAMP,
  index: [
    {
      name: 'QUERY_CREATE_INDEX_ROLLUP_INPUT_FUTURE_TIMESTAMP_BLOCK_HEIGHT',
      creationQuery: QUERY_CREATE_INDEX_ROLLUP_INPUT_FUTURE_TIMESTAMP_BLOCK_HEIGHT,
    },
  ],
};

const QUERY_CREATE_INDEX_ROLLUP_INPUT_ORIGIN_CONTRACT_ADDRESS = `
CREATE INDEX QUERY_CREATE_INDEX_ROLLUP_INPUT_ORIGIN_CONTRACT_ADDRESS ON "rollup_input_origin" (contract_address);
`;

const QUERY_CREATE_TABLE_ROLLUP_INPUT_ORIGIN = `
CREATE TABLE rollup_input_origin (
  id INTEGER PRIMARY KEY REFERENCES rollup_inputs(id) ON DELETE CASCADE,
  primitive_name TEXT,
  caip2 TEXT,
  tx_hash BYTEA,
  contract_address TEXT
);
`;

const TABLE_DATA_ROLLUP_INPUT_ORIGIN: TableData = {
  tableName: 'rollup_input_origin',
  primaryKeyColumns: ['id'],
  columnData: packTuples([
    ['id', 'integer', 'NO', ''],
    ['primitive_name', 'text', 'YES', ''],
    ['caip2', 'text', 'YES', ''],
    ['tx_hash', 'bytea', 'YES', ''],
    ['contract_address', 'text', 'YES', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_ROLLUP_INPUT_ORIGIN,
  index: [
    {
      name: 'QUERY_CREATE_INDEX_ROLLUP_INPUT_ORIGIN_CONTRACT_ADDRESS',
      creationQuery: QUERY_CREATE_INDEX_ROLLUP_INPUT_ORIGIN_CONTRACT_ADDRESS,
    },
  ],
};

const QUERY_CREATE_TABLE_ROLLUP_INPUTS = `
CREATE TABLE rollup_inputs (
  id SERIAL PRIMARY KEY,
  from_address TEXT NOT NULL,
  input_data TEXT NOT NULL
);
`;

const QUERY_CREATE_INDEX_ROLLUP_INPUTS_FROM_ADDRESS = `
CREATE INDEX QUERY_CREATE_INDEX_ROLLUP_INPUTS_BLOCK_HEIGHT ON "rollup_inputs" (from_address);
`;

const TABLE_DATA_ROLLUP_INPUTS: TableData = {
  tableName: 'rollup_inputs',
  primaryKeyColumns: ['id'],
  columnData: packTuples([
    ['id', 'integer', 'NO', ''],
    ['from_address', 'text', 'NO', ''],
    ['input_data', 'text', 'NO', ''],
  ]),
  serialColumns: ['id'],
  creationQuery: QUERY_CREATE_TABLE_ROLLUP_INPUTS,
  index: [
    {
      name: 'QUERY_CREATE_INDEX_ROLLUP_INPUTS_FROM_ADDRESS',
      creationQuery: QUERY_CREATE_INDEX_ROLLUP_INPUTS_FROM_ADDRESS,
    },
  ],
};

const QUERY_CREATE_TABLE_CDE_TRACKING = `
CREATE TABLE cde_tracking (
  block_height INTEGER NOT NULL,
  caip2 TEXT NOT NULL,
  PRIMARY KEY (block_height, caip2)
);
`;

const TABLE_DATA_CDE_TRACKING: TableData = {
  tableName: 'cde_tracking',
  primaryKeyColumns: ['block_height', 'caip2'],
  columnData: packTuples([
    ['block_height', 'integer', 'NO', ''],
    ['caip2', 'text', 'NO', ''],
  ]),
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

const QUERY_CREATE_TABLE_CDE_TRACKING_CURSOR_PAGINATION = `
CREATE TABLE cde_tracking_cursor_pagination (
  cde_name TEXT PRIMARY KEY,
  cursor TEXT NOT NULL,
  finished BOOLEAN NOT NULL
);
`;

const TABLE_DATA_CDE_TRACKING_CURSOR_PAGINATION: TableData = {
  tableName: 'cde_tracking_cursor_pagination',
  primaryKeyColumns: ['cde_name'],
  columnData: packTuples([
    ['cde_name', 'text', 'NO', ''],
    ['cursor', 'text', 'NO', ''],
    ['finished', 'boolean', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_TRACKING_CURSOR_PAGINATION,
};

const QUERY_CREATE_TABLE_CDE = `
CREATE TABLE chain_data_extensions (
  cde_name TEXT PRIMARY KEY,
  cde_type INTEGER NOT NULL,
  cde_hash INTEGER,
  cde_caip2 TEXT NOT NULL,
  start_blockheight INTEGER NOT NULL,
  scheduled_prefix TEXT
);
`;

const TABLE_DATA_CDE: TableData = {
  tableName: 'chain_data_extensions',
  primaryKeyColumns: ['cde_name'],
  columnData: packTuples([
    ['cde_type', 'integer', 'NO', ''],
    ['cde_name', 'text', 'NO', ''],
    ['cde_hash', 'integer', 'YES', ''],
    ['cde_caip2', 'text', 'NO', ''],
    ['start_blockheight', 'integer', 'NO', ''],
    ['scheduled_prefix', 'text', 'YES', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE,
};

const QUERY_CREATE_TABLE_CDE_ERC20 = `
CREATE TABLE cde_erc20_data (
  cde_name TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  balance TEXT NOT NULL,
  PRIMARY KEY (cde_name, wallet_address)
);
`;

const TABLE_DATA_CDE_ERC20: TableData = {
  tableName: 'cde_erc20_data',
  primaryKeyColumns: ['cde_name', 'wallet_address'],
  columnData: packTuples([
    ['cde_name', 'text', 'NO', ''],
    ['wallet_address', 'text', 'NO', ''],
    ['balance', 'text', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_ERC20,
};

const QUERY_CREATE_TABLE_CDE_ERC721 = `
CREATE TABLE cde_erc721_data (
  cde_name TEXT NOT NULL,
  token_id TEXT NOT NULL,
  nft_owner TEXT NOT NULL,
  PRIMARY KEY (cde_name, token_id)
);
`;

const TABLE_DATA_CDE_ERC721: TableData = {
  tableName: 'cde_erc721_data',
  primaryKeyColumns: ['cde_name', 'token_id'],
  columnData: packTuples([
    ['cde_name', 'text', 'NO', ''],
    ['token_id', 'text', 'NO', ''],
    ['nft_owner', 'text', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_ERC721,
};

const QUERY_CREATE_TABLE_CDE_ERC721_BURN = `
CREATE TABLE cde_erc721_burn (
  cde_name TEXT NOT NULL,
  token_id TEXT NOT NULL,
  nft_owner TEXT NOT NULL,
  PRIMARY KEY (cde_name, token_id)
);
`;

const TABLE_DATA_CDE_ERC721_BURN: TableData = {
  tableName: 'cde_erc721_burn',
  primaryKeyColumns: ['cde_name', 'token_id'],
  columnData: packTuples([
    ['cde_name', 'text', 'NO', ''],
    ['token_id', 'text', 'NO', ''],
    ['nft_owner', 'text', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_ERC721_BURN,
};

const QUERY_CREATE_TABLE_CDE_ERC1155_DATA = `
CREATE TABLE cde_erc1155_data (
  cde_name TEXT NOT NULL,
  token_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  balance TEXT NOT NULL,
  PRIMARY KEY (cde_name, token_id, wallet_address)
);
`;

const TABLE_DATA_CDE_ERC1155_DATA: TableData = {
  tableName: 'cde_erc1155_data',
  primaryKeyColumns: ['cde_name', 'token_id'],
  columnData: packTuples([
    ['cde_name', 'text', 'NO', ''],
    ['token_id', 'text', 'NO', ''],
    ['wallet_address', 'text', 'NO', ''],
    ['balance', 'text', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_ERC1155_DATA,
};

const QUERY_CREATE_TABLE_CDE_ERC1155_BURN = `
CREATE TABLE cde_erc1155_burn (
  cde_name TEXT NOT NULL,
  token_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  balance TEXT NOT NULL,
  PRIMARY KEY (cde_name, token_id, wallet_address)
);
`;

const TABLE_DATA_CDE_ERC1155_BURN: TableData = {
  tableName: 'cde_erc1155_burn',
  primaryKeyColumns: ['cde_name', 'token_id'],
  columnData: packTuples([
    ['cde_name', 'text', 'NO', ''],
    ['token_id', 'text', 'NO', ''],
    ['wallet_address', 'text', 'NO', ''],
    ['balance', 'text', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_ERC1155_BURN,
};

const QUERY_CREATE_TABLE_CDE_ERC20_DEPOSIT = `
CREATE TABLE cde_erc20_deposit_data (
  cde_name TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  total_deposited TEXT NOT NULL,
  PRIMARY KEY (cde_name, wallet_address)
);
`;

const TABLE_DATA_CDE_ERC20_DEPOSIT: TableData = {
  tableName: 'cde_erc20_deposit_data',
  primaryKeyColumns: ['cde_name', 'wallet_address'],
  columnData: packTuples([
    ['cde_name', 'text', 'NO', ''],
    ['wallet_address', 'text', 'NO', ''],
    ['total_deposited', 'text', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_ERC20_DEPOSIT,
};

const QUERY_CREATE_TABLE_CDE_GENERIC_DATA = `
CREATE TABLE cde_generic_data (
  cde_name TEXT NOT NULL,
  id SERIAL,
  block_height INTEGER NOT NULL,
  event_data JSON NOT NULL,
  PRIMARY KEY (cde_name, id)
);
`;

const TABLE_DATA_CDE_GENERIC_DATA: TableData = {
  tableName: 'cde_generic_data',
  primaryKeyColumns: ['cde_name', 'id'],
  columnData: packTuples([
    ['cde_name', 'text', 'NO', ''],
    ['id', 'integer', 'NO', ''],
    ['block_height', 'integer', 'NO', ''],
    ['event_data', 'json', 'NO', ''],
  ]),
  serialColumns: ['id'],
  creationQuery: QUERY_CREATE_TABLE_CDE_GENERIC_DATA,
};

const QUERY_CREATE_TABLE_CDE_ERC6551_REGISTRY = `
CREATE TABLE cde_erc6551_registry_data (
  cde_name TEXT NOT NULL,
  block_height INTEGER NOT NULL,
  account_created TEXT NOT NULL,
  implementation TEXT NOT NULL,
  token_contract TEXT NOT NULL,
  token_id TEXT NOT NULL,
  chain_id TEXT NOT NULL,
  salt TEXT NOT NULL,
  PRIMARY KEY (cde_name, account_created)
);
`;

const TABLE_DATA_CDE_ERC6551_REGISTRY: TableData = {
  tableName: 'cde_erc6551_registry_data',
  primaryKeyColumns: ['cde_name', 'account_created'],
  columnData: packTuples([
    ['cde_name', 'text', 'NO', ''],
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
  cde_name TEXT NOT NULL,
  epoch INTEGER NOT NULL,
  address TEXT NOT NULL,
  pool TEXT,
  PRIMARY KEY (cde_name, epoch, address)
);
`;

const TABLE_DATA_CDE_CARDANO_POOL: TableData = {
  tableName: 'cde_cardano_pool_delegation',
  primaryKeyColumns: ['cde_name', 'epoch', 'address'],
  columnData: packTuples([
    ['cde_name', 'text', 'NO', ''],
    ['epoch', 'integer', 'NO', ''],
    ['address', 'text', 'NO', ''],
    ['pool', 'text', 'YES', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_CARDANO_POOL,
};

const QUERY_CREATE_TABLE_CDE_CARDANO_PROJECTED_NFT = `
CREATE TABLE cde_cardano_projected_nft (
  cde_name TEXT NOT NULL,
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
  PRIMARY KEY (cde_name, id)
)
`;

const TABLE_DATA_CDE_CARDANO_PROJECTED_NFT: TableData = {
  tableName: 'cde_cardano_projected_nft',
  primaryKeyColumns: ['cde_name', 'id'],
  columnData: packTuples([
    ['cde_name', 'text', 'NO', ''],
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

const QUERY_CREATE_TABLE_CDE_CARDANO_ASSET_UTXOS = `
CREATE TABLE cde_cardano_asset_utxos (
  cde_name TEXT NOT NULL,
  address TEXT NOT NULL,
  tx_id TEXT NOT NULL,
  output_index INTEGER NOT NULL,
  amount BIGINT NOT NULL,
  cip14_fingerprint TEXT NOT NULL,
  policy_id text NOT NULL,
  asset_name text NOT NULL,
  PRIMARY KEY(cde_name,tx_id,output_index,cip14_fingerprint)
);
`;

const QUERY_CREATE_INDEX_CDE_CARDANO_ASSET_UTXOS_ADDRESS = `
CREATE INDEX CDE_CARDANO_ASSET_UTXOS_ADDRESS_INDEX ON "cde_cardano_asset_utxos" (ADDRESS);
`;

const TABLE_DATA_CDE_CARDANO_ASSET_UTXOS: TableData = {
  tableName: 'cde_cardano_asset_utxos',
  primaryKeyColumns: ['cde_name', 'tx_id', 'output_index'],
  columnData: packTuples([
    ['cde_name', 'text', 'NO', ''],
    ['address', 'text', 'NO', ''],
    ['tx_id', 'text', 'NO', ''],
    ['output_index', 'integer', 'NO', ''],
    ['amount', 'bigint', 'NO', ''],
    ['cip14_fingerprint', 'text', 'NO', ''],
    ['policy_id', 'text', 'NO', ''],
    ['asset_name', 'text', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_CARDANO_ASSET_UTXOS,
  index: {
    name: 'CDE_CARDANO_ASSET_UTXOS_ADDRESS_INDEX',
    creationQuery: QUERY_CREATE_INDEX_CDE_CARDANO_ASSET_UTXOS_ADDRESS,
  },
};

const QUERY_CREATE_TABLE_CDE_CARDANO_TRANSFER = `
CREATE TABLE cde_cardano_transfer (
  cde_name TEXT NOT NULL,
  tx_id TEXT NOT NULL,
  raw_tx TEXT NOT NULL,
  metadata TEXT,
  PRIMARY KEY (cde_name, tx_id)
)
`;

const TABLE_DATA_CDE_CARDANO_TRANSFER: TableData = {
  tableName: 'cde_cardano_transfer',
  primaryKeyColumns: ['cde_name', 'tx_id'],
  columnData: packTuples([
    ['cde_name', 'text', 'NO', ''],
    ['tx_id', 'text', 'NO', ''],
    ['raw_tx', 'text', 'NO', ''],
    ['metadata', 'text', 'YES', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_CARDANO_TRANSFER,
};

const QUERY_CREATE_TABLE_CDE_CARDANO_MINT_BURN = `
CREATE TABLE cde_cardano_mint_burn(
  cde_name TEXT NOT NULL,
  tx_id TEXT NOT NULL,
  metadata TEXT NOT NULL,
  assets JSONB NOT NULL,
  input_addresses JSONB NOT NULL,
  output_addresses JSONB NOT NULL,
  PRIMARY KEY (cde_name, tx_id)
)
`;

const TABLE_DATA_CDE_CARDANO_MINT_BURN: TableData = {
  tableName: 'cde_cardano_mint_burn',
  primaryKeyColumns: ['cde_name', 'tx_id'],
  columnData: packTuples([
    ['cde_name', 'text', 'NO', ''],
    ['tx_id', 'text', 'NO', ''],
    ['metadata', 'text', 'NO', ''],
    ['assets', 'jsonb', 'NO', ''],
    ['input_addresses', 'jsonb', 'NO', ''],
    ['output_addresses', 'jsonb', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_CARDANO_MINT_BURN,
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

const QUERY_CREATE_TABLE_ADDRESSES = `
CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  address TEXT NOT NULL UNIQUE
);
`;

const TABLE_DATA_ADDRESSES: TableData = {
  tableName: 'addresses',
  primaryKeyColumns: ['id'],
  columnData: packTuples([
    ['id', 'integer', 'NO', ''],
    ['address', 'text', 'NO', ''],
  ]),
  serialColumns: ['id'],
  creationQuery: QUERY_CREATE_TABLE_ADDRESSES,
};

const QUERY_CREATE_TABLE_DELEGATIONS = `
CREATE TABLE delegations (
	from_id INTEGER NOT NULL REFERENCES addresses(id),
	to_id INTEGER NOT NULL REFERENCES addresses(id),
  PRIMARY KEY (from_id, to_id)
);
`;

const TABLE_DATA_DELEGATIONS: TableData = {
  tableName: 'delegations',
  primaryKeyColumns: ['from_id', 'to_id'],
  columnData: packTuples([
    ['from_id', 'integer', 'NO', ''],
    ['to_id', 'integer', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_DELEGATIONS,
};

const QUERY_CREATE_TABLE_MINA_CHECKPOINT = `
CREATE TABLE mina_checkpoint (
  timestamp TEXT NOT NULL,
  caip2 TEXT NOT NULL,
  PRIMARY KEY (caip2)
);
`;

const TABLE_DATA_MINA_CHECKPOINT: TableData = {
  tableName: 'mina_checkpoint',
  primaryKeyColumns: ['caip2'],
  columnData: packTuples([
    ['timestamp', 'text', 'NO', ''],
    ['caip2', 'text', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_MINA_CHECKPOINT,
};

const QUERY_CREATE_TABLE_MIDNIGHT_CHECKPOINT = `
CREATE TABLE midnight_checkpoint (
  caip2 TEXT NOT NULL,
  block_height INTEGER NOT NULL,
  PRIMARY KEY (caip2)
);
`;

const TABLE_DATA_MIDNIGHT_CHECKPOINT: TableData = {
  tableName: 'midnight_checkpoint',
  primaryKeyColumns: ['caip2'],
  columnData: packTuples([
    ['caip2', 'text', 'NO', ''],
    ['block_height', 'integer', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_MIDNIGHT_CHECKPOINT,
};

const QUERY_CREATE_TABLE_ACHIEVEMENT_PROGRESS = `
CREATE TABLE achievement_progress(
  wallet INTEGER NOT NULL REFERENCES addresses(id),
  name TEXT NOT NULL,
  completed_date TIMESTAMP,
  progress INTEGER,
  total INTEGER,
  PRIMARY KEY (wallet, name)
);
`;

const TABLE_DATA_ACHIEVEMENT_PROGRESS: TableData = {
  tableName: 'achievement_progress',
  primaryKeyColumns: ['wallet', 'name'],
  columnData: packTuples([
    ['wallet', 'integer', 'NO', ''],
    ['name', 'text', 'NO', ''],
    ['completed_date', 'timestamp without time zone', 'YES', ''],
    ['progress', 'integer', 'YES', ''],
    ['total', 'integer', 'YES', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_ACHIEVEMENT_PROGRESS,
};

const FUNCTION_NOTIFY_WALLET_CONNECT: string = `
create or replace function public.notify_wallet_connect()
  returns trigger
  language plpgsql
as $function$
DECLARE
  rec RECORD;
  payload TEXT;
  column_name TEXT;
  column_value TEXT;
  payload_items TEXT[];
begin
  CASE TG_OP
    WHEN 'INSERT', 'UPDATE' THEN
      rec := NEW;
    WHEN 'DELETE' THEN
      rec := OLD;
    ELSE
      RAISE EXCEPTION 'Unknown TG_OP: "%". Should not occur!', TG_OP;
  END CASE;

   -- Get required fields
  FOREACH column_name IN ARRAY TG_ARGV LOOP
    EXECUTE format('SELECT $1.%I::TEXT', column_name)
    INTO column_value
    USING rec;
    payload_items := array_append(payload_items, '"' || replace(column_name, '"', '\"') || '":"' || replace(column_value, '"', '\"') || '"');
  END LOOP;
	  -- Build the payload
  payload := ''
              || '{'
              || '"timestamp":"' || CURRENT_TIMESTAMP                    || '",'
              || '"operation":"' || TG_OP                                || '",'
              || '"schema":"'    || TG_TABLE_SCHEMA                      || '",'
              || '"table":"'     || TG_TABLE_NAME                        || '",'
              || '"data":{'      || array_to_string(payload_items, ',')  || '}'
              || '}';

	perform pg_notify('wallet_connect_change', payload);
 	return null;
end;
$function$
;`;

const FUNCTION_TRIGGER_ADDRESSES: string = `
CREATE OR REPLACE TRIGGER wallet_connect_insert_or_update
  AFTER INSERT OR UPDATE or delete ON addresses
  for each row execute procedure notify_wallet_connect('id', 'address');
`;

const FUNCTION_TRIGGER_DELEGATIONS: string = `
CREATE OR REPLACE TRIGGER wallet_connect_insert_or_update
  AFTER INSERT OR UPDATE or delete ON delegations
  for each row execute procedure notify_wallet_connect('from_id', 'to_id');
`;

const QUERY_CREATE_TABLE_CDE_DYNAMIC_PRIMITIVE_CONFIG = `
CREATE TABLE cde_dynamic_primitive_config (
  cde_name TEXT NOT NULL,
  parent TEXT NOT NULL,
  config JSONB NOT NULL,
  PRIMARY KEY(cde_name)
);
`;

const TABLE_DATA_CDE_DYNAMIC_PRIMITIVE_CONFIG: TableData = {
  tableName: 'cde_dynamic_primitive_config',
  primaryKeyColumns: ['cde_name'],
  columnData: packTuples([
    ['cde_name', 'text', 'NO', ''],
    ['parent', 'text', 'NO', ''],
    ['config', 'jsonb', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_DYNAMIC_PRIMITIVE_CONFIG,
};

const QUERY_CREATE_TABLE_EVENT = `
CREATE TABLE event (
  id SERIAL PRIMARY KEY,
  topic TEXT NOT NULL,
  address TEXT NOT NULL,
  data JSONB NOT NULL,
  block_height INTEGER NOT NULL,
  tx_index INTEGER NOT NULL,
  log_index INTEGER NOT NULL
);
`;

const QUERY_CREATE_INDEX_EVENT_TOPIC = `
CREATE INDEX EVENT_TOPIC_INDEX ON "event" (topic);
`;

const TABLE_DATA_EVENT: TableData = {
  tableName: 'event',
  primaryKeyColumns: ['id'],
  columnData: packTuples([
    ['id', 'integer', 'NO', ''],
    ['topic', 'text', 'NO', ''],
    ['address', 'text', 'NO', ''],
    ['data', 'jsonb', 'NO', ''],
    ['block_height', 'integer', 'NO', ''],
    ['tx_index', 'integer', 'NO', ''],
    ['log_index', 'integer', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_EVENT,
  index: {
    name: 'EVENT_TOPIC_INDEX',
    creationQuery: QUERY_CREATE_INDEX_EVENT_TOPIC,
  },
};

const QUERY_CREATE_TABLE_REGISTERED_EVENT = `
CREATE TABLE registered_event (
  name TEXT NOT NULL,
  topic TEXT NOT NULL,
  PRIMARY KEY(name, topic)
);
`;

const TABLE_DATA_REGISTERED_EVENT: TableData = {
  tableName: 'registered_event',
  primaryKeyColumns: ['name', 'topic'],
  columnData: packTuples([
    ['name', 'text', 'NO', ''],
    ['topic', 'text', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_REGISTERED_EVENT,
};

export const FUNCTIONS: string[] = [
  FUNCTION_NOTIFY_WALLET_CONNECT,
  FUNCTION_TRIGGER_ADDRESSES,
  FUNCTION_TRIGGER_DELEGATIONS,
];
export const TABLES: TableData[] = [
  TABLE_DATA_PAIMA_BLOCKS,
  TABLE_DATA_NONCES,
  TABLE_DATA_ROLLUP_INPUTS,
  TABLE_DATA_ROLLUP_INPUT_RESULT,
  TABLE_DATA_ROLLUP_INPUT_FUTURE_BLOCK,
  TABLE_DATA_ROLLUP_INPUT_FUTURE_TIMESTAMP,
  TABLE_DATA_ROLLUP_INPUT_ORIGIN,
  TABLE_DATA_CDE_TRACKING,
  TABLE_DATA_CDE_TRACKING_CARDANO,
  TABLE_DATA_CDE,
  TABLE_DATA_CDE_ERC20,
  TABLE_DATA_CDE_ERC721,
  TABLE_DATA_CDE_ERC721_BURN,
  TABLE_DATA_CDE_ERC1155_DATA,
  TABLE_DATA_CDE_ERC1155_BURN,
  TABLE_DATA_CDE_ERC20_DEPOSIT,
  TABLE_DATA_CDE_GENERIC_DATA,
  TABLE_DATA_CDE_ERC6551_REGISTRY,
  TABLE_DATA_CDE_CARDANO_POOL,
  TABLE_DATA_CDE_CARDANO_PROJECTED_NFT,
  TABLE_DATA_CDE_CARDANO_ASSET_UTXOS,
  TABLE_DATA_EMULATED,
  TABLE_DATA_ADDRESSES,
  TABLE_DATA_DELEGATIONS,
  TABLE_DATA_CARDANO_LAST_EPOCH,
  TABLE_DATA_CDE_TRACKING_CURSOR_PAGINATION,
  TABLE_DATA_CDE_CARDANO_TRANSFER,
  TABLE_DATA_CDE_CARDANO_MINT_BURN,
  TABLE_DATA_MINA_CHECKPOINT,
  TABLE_DATA_MIDNIGHT_CHECKPOINT,
  TABLE_DATA_ACHIEVEMENT_PROGRESS,
  TABLE_DATA_CDE_DYNAMIC_PRIMITIVE_CONFIG,
  TABLE_DATA_EVENT,
  TABLE_DATA_REGISTERED_EVENT,
];
