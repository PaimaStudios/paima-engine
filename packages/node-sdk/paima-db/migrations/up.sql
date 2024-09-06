CREATE TABLE paima_blocks (
  block_height INTEGER PRIMARY KEY,
  ver INTEGER NOT NULL,
  main_chain_block_hash BYTEA NOT NULL,
  seed TEXT NOT NULL,
  ms_timestamp TIMESTAMP without time zone NOT NULL,

  -- note: slightly awkward, but this field is nullable
  --       this helps other SQL queries refer to the block before the block is done being processed
  paima_block_hash BYTEA
);

CREATE TABLE nonces (
  nonce TEXT PRIMARY KEY,
  block_height INTEGER NOT NULL
);

CREATE TABLE rollup_inputs (
  id SERIAL PRIMARY KEY,
  from_address TEXT NOT NULL,
  input_data TEXT NOT NULL
);

CREATE TABLE rollup_input_future_block (
  id INTEGER PRIMARY KEY REFERENCES rollup_inputs(id) ON DELETE CASCADE,
  future_block_height INTEGER NOT NULL
);
CREATE TABLE rollup_input_future_timestamp (
  id INTEGER PRIMARY KEY REFERENCES rollup_inputs(id) ON DELETE CASCADE,
  future_ms_timestamp TIMESTAMP without time zone NOT NULL
);

CREATE TABLE rollup_input_result (
  id INTEGER PRIMARY KEY REFERENCES rollup_inputs(id) ON DELETE CASCADE,
  success BOOLEAN NOT NULL,
  paima_tx_hash BYTEA NOT NULL,
  block_height INTEGER NOT NULL REFERENCES paima_blocks(block_height),
  index_in_block INTEGER NOT NULL
);

CREATE TABLE rollup_input_origin (
  id INTEGER PRIMARY KEY REFERENCES rollup_inputs(id) ON DELETE CASCADE,
  primitive_name TEXT,
  caip2 TEXT,
  tx_hash BYTEA,
  contract_address TEXT
);

-- tracks the processed blocks for a given network to help with syncing
CREATE TABLE cde_tracking (
  block_height INTEGER NOT NULL,
  caip2 TEXT NOT NULL,
  PRIMARY KEY (block_height, caip2)
);

CREATE TABLE cde_tracking_cardano (
  id INTEGER PRIMARY KEY,
  slot INTEGER NOT NULL
);

CREATE TABLE chain_data_extensions (
  cde_name TEXT PRIMARY KEY,
  cde_type INTEGER NOT NULL,
  cde_hash INTEGER,
  cde_caip2 TEXT NOT NULL,
  start_blockheight INTEGER NOT NULL,
  scheduled_prefix TEXT
);

CREATE TABLE cde_erc20_data (
  cde_name TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  balance TEXT NOT NULL,
  PRIMARY KEY (cde_name, wallet_address)
);

CREATE TABLE cde_erc721_data (
  cde_name TEXT NOT NULL,
  token_id TEXT NOT NULL,
  nft_owner TEXT NOT NULL,
  PRIMARY KEY (cde_name, token_id)
);

CREATE TABLE cde_erc721_burn (
  cde_name TEXT NOT NULL,
  token_id TEXT NOT NULL,
  nft_owner TEXT NOT NULL,
  PRIMARY KEY(cde_name, token_id)
);

CREATE TABLE cde_erc1155_data (
  cde_name TEXT NOT NULL,
  token_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  balance TEXT NOT NULL,
  PRIMARY KEY (cde_name, token_id, wallet_address)
);

CREATE TABLE cde_erc1155_burn (
  cde_name TEXT NOT NULL,
  token_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  balance TEXT NOT NULL,
  PRIMARY KEY (cde_name, token_id, wallet_address)
);

CREATE TABLE cde_erc20_deposit_data (
  cde_name TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  total_deposited TEXT NOT NULL,
  PRIMARY KEY (cde_name, wallet_address)
);

CREATE TABLE cde_generic_data (
  cde_name TEXT NOT NULL,
  id SERIAL,
  block_height INTEGER NOT NULL,
  event_data JSON NOT NULL,
  PRIMARY KEY (cde_name, id)
);

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

CREATE TABLE emulated_block_heights (
  deployment_chain_block_height INTEGER PRIMARY KEY,
  second_timestamp TEXT NOT NULL,
  emulated_block_height INTEGER NOT NULL
);

CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  address TEXT NOT NULL UNIQUE
);

CREATE TABLE delegations (
  from_id INTEGER NOT NULL REFERENCES addresses(id),
  to_id INTEGER NOT NULL REFERENCES addresses(id),
 PRIMARY KEY (from_id, to_id)
);

-- Create a function to notify any change in address or delegate tables
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
;

CREATE OR REPLACE TRIGGER wallet_connect_insert_or_update
  AFTER INSERT OR UPDATE or delete ON addresses
  for each row execute procedure notify_wallet_connect('id', 'address');

CREATE OR REPLACE TRIGGER wallet_connect_insert_or_update
  AFTER INSERT OR UPDATE or delete ON delegations
  for each row execute procedure notify_wallet_connect('from_id', 'to_id');


CREATE TABLE cde_cardano_pool_delegation (
  cde_name TEXT NOT NULL,
  epoch INTEGER NOT NULL,
  address TEXT NOT NULL,
  pool TEXT,
  PRIMARY KEY (cde_name, epoch, address)
);

CREATE TABLE cardano_last_epoch (
  id INTEGER PRIMARY KEY,
  epoch INTEGER NOT NULL
);

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
);

CREATE TABLE cde_cardano_asset_utxos (
  cde_name TEXT NOT NULL,
  address TEXT NOT NULL,
  tx_id TEXT NOT NULL,
  output_index INTEGER NOT NULL,
  amount BIGINT NOT NULL,
  cip14_fingerprint TEXT NOT NULL,
  policy_id TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  PRIMARY KEY(cde_name,tx_id,output_index,cip14_fingerprint)
);

CREATE TABLE cde_tracking_cursor_pagination (
  cde_name TEXT PRIMARY KEY,
  cursor TEXT NOT NULL,
  finished BOOLEAN NOT NULL
);

CREATE TABLE cde_cardano_transfer (
  cde_name TEXT NOT NULL,
  tx_id TEXT NOT NULL,
  raw_tx TEXT NOT NULL,
  metadata TEXT,
  PRIMARY KEY (cde_name, tx_id)
);

CREATE TABLE cde_cardano_mint_burn(
  cde_name TEXT NOT NULL,
  tx_id TEXT NOT NULL,
  metadata TEXT NOT NULL,
  assets JSONB NOT NULL,
  input_addresses JSONB NOT NULL,
  output_addresses JSONB NOT NULL,
  PRIMARY KEY (cde_name, tx_id)
);

CREATE TABLE mina_checkpoint (
  timestamp TEXT NOT NULL,
  caip2 TEXT NOT NULL,
  PRIMARY KEY (caip2)
);

CREATE TABLE midnight_checkpoint (
  caip2 TEXT NOT NULL,
  block_height INTEGER NOT NULL,
  PRIMARY KEY (caip2)
);

CREATE TABLE achievement_progress(
  wallet INTEGER NOT NULL REFERENCES addresses(id),
  name TEXT NOT NULL,
  completed_date TIMESTAMP,
  progress INTEGER,
  total INTEGER,
  PRIMARY KEY (wallet, name)
);

CREATE TABLE cde_dynamic_primitive_config (
  cde_name TEXT NOT NULL,
  parent TEXT NOT NULL,
  config JSONB NOT NULL,
  PRIMARY KEY(cde_name)
);

CREATE TABLE event (
  id SERIAL PRIMARY KEY,
  topic TEXT NOT NULL,
  address TEXT NOT NULL,
  data JSONB NOT NULL,
  block_height INTEGER NOT NULL,
  tx_index INTEGER NOT NULL,
  log_index INTEGER NOT NULL
);

CREATE TABLE registered_event (
  name TEXT NOT NULL,
  topic TEXT NOT NULL,
  PRIMARY KEY(name, topic)
);
