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
  block_height INTEGER NOT NULL,
  network TEXT NOT NULL,
  PRIMARY KEY (block_height, network)
);
`;

const TABLE_DATA_CDE_TRACKING: TableData = {
  tableName: 'cde_tracking',
  primaryKeyColumns: ['block_height', 'network'],
  columnData: packTuples([
    ['block_height', 'integer', 'NO', ''],
    ['network', 'text', 'NO', ''],
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
  cde_id INTEGER PRIMARY KEY,
  cursor TEXT NOT NULL,
  finished BOOLEAN NOT NULL
);
`;

const TABLE_DATA_CDE_TRACKING_CURSOR_PAGINATION: TableData = {
  tableName: 'cde_tracking_cursor_pagination',
  primaryKeyColumns: ['cde_id'],
  columnData: packTuples([
    ['cde_id', 'integer', 'NO', ''],
    ['cursor', 'text', 'NO', ''],
    ['finished', 'boolean', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_TRACKING_CURSOR_PAGINATION,
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

const QUERY_CREATE_TABLE_CDE_ERC721_BURN = `
CREATE TABLE cde_erc721_burn (
  cde_id INTEGER NOT NULL,
  token_id TEXT NOT NULL,
  nft_owner TEXT NOT NULL,
  PRIMARY KEY (cde_id, token_id)
);
`;

const TABLE_DATA_CDE_ERC721_BURN: TableData = {
  tableName: 'cde_erc721_burn',
  primaryKeyColumns: ['cde_id', 'token_id'],
  columnData: packTuples([
    ['cde_id', 'integer', 'NO', ''],
    ['token_id', 'text', 'NO', ''],
    ['nft_owner', 'text', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_ERC721_BURN,
};

const QUERY_CREATE_TABLE_CDE_ERC1155_DATA = `
CREATE TABLE cde_erc1155_data (
  cde_id INTEGER NOT NULL,
  token_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  balance TEXT NOT NULL,
  PRIMARY KEY (cde_id, token_id, wallet_address)
);
`;

const TABLE_DATA_CDE_ERC1155_DATA: TableData = {
  tableName: 'cde_erc1155_data',
  primaryKeyColumns: ['cde_id', 'token_id'],
  columnData: packTuples([
    ['cde_id', 'integer', 'NO', ''],
    ['token_id', 'text', 'NO', ''],
    ['wallet_address', 'text', 'NO', ''],
    ['balance', 'text', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_ERC1155_DATA,
};

const QUERY_CREATE_TABLE_CDE_ERC1155_BURN = `
CREATE TABLE cde_erc1155_burn (
  cde_id INTEGER NOT NULL,
  token_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  balance TEXT NOT NULL,
  PRIMARY KEY (cde_id, token_id, wallet_address)
);
`;

const TABLE_DATA_CDE_ERC1155_BURN: TableData = {
  tableName: 'cde_erc1155_burn',
  primaryKeyColumns: ['cde_id', 'token_id'],
  columnData: packTuples([
    ['cde_id', 'integer', 'NO', ''],
    ['token_id', 'text', 'NO', ''],
    ['wallet_address', 'text', 'NO', ''],
    ['balance', 'text', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_ERC1155_BURN,
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

const QUERY_CREATE_TABLE_CDE_CARDANO_ASSET_UTXOS = `
CREATE TABLE cde_cardano_asset_utxos (
  cde_id INTEGER NOT NULL,
  address TEXT NOT NULL,
  tx_id TEXT NOT NULL,
  output_index INTEGER NOT NULL,
  amount BIGINT NOT NULL,
  cip14_fingerprint TEXT NOT NULL,
  policy_id text NOT NULL,
  asset_name text NOT NULL,
  PRIMARY KEY(cde_id,tx_id,output_index,cip14_fingerprint)
);
`;

const QUERY_CREATE_INDEX_CDE_CARDANO_ASSET_UTXOS_ADDRESS = `
CREATE INDEX CDE_CARDANO_ASSET_UTXOS_ADDRESS_INDEX ON "cde_cardano_asset_utxos" (ADDRESS);
`;

const TABLE_DATA_CDE_CARDANO_ASSET_UTXOS: TableData = {
  tableName: 'cde_cardano_asset_utxos',
  primaryKeyColumns: ['cde_id', 'tx_id', 'output_index'],
  columnData: packTuples([
    ['cde_id', 'integer', 'NO', ''],
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
  cde_id INTEGER NOT NULL,
  tx_id TEXT NOT NULL,
  raw_tx TEXT NOT NULL,
  metadata TEXT,
  PRIMARY KEY (cde_id, tx_id)
)
`;

const TABLE_DATA_CDE_CARDANO_TRANSFER: TableData = {
  tableName: 'cde_cardano_transfer',
  primaryKeyColumns: ['cde_id', 'tx_id'],
  columnData: packTuples([
    ['cde_id', 'integer', 'NO', ''],
    ['tx_id', 'text', 'NO', ''],
    ['raw_tx', 'text', 'NO', ''],
    ['metadata', 'text', 'YES', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_CDE_CARDANO_TRANSFER,
};

const QUERY_CREATE_TABLE_CDE_CARDANO_MINT_BURN = `
CREATE TABLE cde_cardano_mint_burn(
  cde_id INTEGER NOT NULL,
  tx_id TEXT NOT NULL,
  metadata TEXT NOT NULL,
  assets JSONB NOT NULL,
  input_addresses JSONB NOT NULL,
  output_addresses JSONB NOT NULL,
  PRIMARY KEY (cde_id, tx_id)
)
`;

const TABLE_DATA_CDE_CARDANO_MINT_BURN: TableData = {
  tableName: 'cde_cardano_mint_burn',
  primaryKeyColumns: ['cde_id', 'tx_id'],
  columnData: packTuples([
    ['cde_id', 'integer', 'NO', ''],
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
  network TEXT NOT NULL,
  PRIMARY KEY (network)
);
`;

const TABLE_DATA_MINA_CHECKPOINT: TableData = {
  tableName: 'mina_checkpoint',
  primaryKeyColumns: ['network'],
  columnData: packTuples([
    ['timestamp', 'text', 'NO', ''],
    ['network', 'text', 'NO', ''],
  ]),
  serialColumns: [],
  creationQuery: QUERY_CREATE_TABLE_MINA_CHECKPOINT,
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

export const FUNCTIONS: string[] = [
  FUNCTION_NOTIFY_WALLET_CONNECT,
  FUNCTION_TRIGGER_ADDRESSES,
  FUNCTION_TRIGGER_DELEGATIONS,
];
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
];
