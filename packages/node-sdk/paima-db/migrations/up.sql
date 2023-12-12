CREATE TABLE block_heights ( 
  block_height INTEGER PRIMARY KEY,
  seed TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE scheduled_data (
  id SERIAL PRIMARY KEY,
  block_height INTEGER NOT NULL,
  input_data TEXT NOT NULL
);

CREATE TABLE nonces (
  nonce TEXT PRIMARY KEY,
  block_height INTEGER NOT NULL
);

CREATE TABLE historical_game_inputs (
  id SERIAL PRIMARY KEY,
  block_height INTEGER NOT NULL,
  user_address TEXT NOT NULL,
  input_data TEXT NOT NULL
);

CREATE TABLE cde_tracking (
  block_height INTEGER PRIMARY KEY
);

CREATE TABLE cde_tracking_cardano (
  id INTEGER PRIMARY KEY,
  slot INTEGER NOT NULL
);

CREATE TABLE chain_data_extensions (
  cde_id INTEGER PRIMARY KEY,
  cde_type INTEGER NOT NULL,
  cde_name TEXT NOT NULL,
  cde_hash integer NOT NULL,
  start_blockheight INTEGER NOT NULL,
  scheduled_prefix TEXT
);

CREATE TABLE cde_erc20_data (
  cde_id INTEGER NOT NULL,
  wallet_address TEXT NOT NULL,
  balance TEXT NOT NULL,
  PRIMARY KEY (cde_id, wallet_address)
);

CREATE TABLE cde_erc721_data (
  cde_id INTEGER NOT NULL,
  token_id TEXT NOT NULL,
  nft_owner TEXT NOT NULL,
  PRIMARY KEY (cde_id, token_id)
);

CREATE TABLE cde_erc20_deposit_data (
  cde_id INTEGER NOT NULL,
  wallet_address TEXT NOT NULL,
  total_deposited TEXT NOT NULL,
  PRIMARY KEY (cde_id, wallet_address)
);

CREATE TABLE cde_generic_data (
  cde_id INTEGER NOT NULL,
  id SERIAL,
  block_height INTEGER NOT NULL,
  event_data JSON NOT NULL,
  PRIMARY KEY (cde_id, id)
);

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

CREATE TABLE emulated_block_heights (
  deployment_chain_block_height INTEGER PRIMARY KEY,
  second_timestamp TEXT NOT NULL,
  emulated_block_height INTEGER NOT NULL
);

CREATE TABLE cde_cardano_pool_delegation (
  cde_id INTEGER NOT NULL,
  address TEXT NOT NULL,
  pool TEXT,
  PRIMARY KEY (cde_id, address)
);
