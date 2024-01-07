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
  cde_id INTEGER NOT NULL,
  epoch INTEGER NOT NULL,
  address TEXT NOT NULL,
  pool TEXT,
  PRIMARY KEY (cde_id, epoch, address)
);

CREATE TABLE cardano_last_epoch (
  id INTEGER PRIMARY KEY,
  epoch INTEGER NOT NULL
);

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
);