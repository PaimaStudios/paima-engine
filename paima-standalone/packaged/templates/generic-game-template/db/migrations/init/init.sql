-- Generic paima engine tables, that shouldn't be modified

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

-- Extend the schema to fit your needs

CREATE TABLE users (
  wallet TEXT NOT NULL PRIMARY KEY,
  experience INTEGER NOT NULL DEFAULT 0
);
