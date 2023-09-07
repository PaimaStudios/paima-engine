CREATE TABLE unvalidated_game_inputs (
  id SERIAL PRIMARY KEY,
  address_type INTEGER NOT NULL,
  user_address TEXT NOT NULL,
  game_input TEXT NOT NULL,
  millisecond_timestamp TEXT NOT NULL,
  user_signature TEXT NOT NULL
);

CREATE TABLE validated_game_inputs (
  id SERIAL PRIMARY KEY,
  address_type INTEGER NOT NULL,
  user_address TEXT NOT NULL,
  game_input TEXT NOT NULL,
  millisecond_timestamp TEXT NOT NULL,
  user_signature TEXT NOT NULL
);

CREATE TYPE input_state AS ENUM ('validating', 'rejected', 'accepted', 'posted');

CREATE TABLE input_states (
  input_hash TEXT PRIMARY KEY,
  current_state input_state NOT NULL,
  block_height INTEGER,
  transaction_hash TEXT,
  rejection_code INTEGER
);

CREATE TABLE user_tracking (
  user_address TEXT PRIMARY KEY,
  latest_timestamp TIMESTAMP NOT NULL,
  inputs_minute INTEGER NOT NULL,
  inputs_day INTEGER NOT NULL,
  inputs_total INTEGER NOT NULL
);