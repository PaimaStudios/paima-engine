export const gameBackendVersion = '0.1.0';

export const CHAIN_URI = process.env.CHAIN_URI || '';
export const CHAIN_NAME = process.env.CHAIN_NAME || '';
export const CHAIN_ID = parseInt(process.env.CHAIN_ID || '', 10);
export const CHAIN_EXPLORER_URI = process.env.CHAIN_EXPLORER_URI || '';
export const CHAIN_CURRENCY_NAME = process.env.CHAIN_CURRENCY_NAME || '';
export const CHAIN_CURRENCY_SYMBOL = process.env.CHAIN_CURRENCY_SYMBOL || '';
export const CHAIN_CURRENCY_DECIMALS = parseInt(process.env.CHAIN_CURRENCY_DECIMALS || '0', 10);

export const STORAGE_ADDRESS = process.env.STORAGE_ADDRESS || '';
export const STORAGE_CONTRACT_DEPLOYMENT_BLOCKHEIGHT = parseInt(
  process.env.STORAGE_CONTRACT_DEPLOYMENT_BLOCKHEIGHT || '0'
);
export const DEFAULT_FEE = process.env.DEFAULT_FEE || '';
export const DEPLOYMENT = process.env.DEPLOYMENT || '';
export const START_BLOCKHEIGHT = parseInt(process.env.START_BLOCKHEIGHT || '0', 10);

export const BACKEND_URI = process.env.BACKEND_URI || '';
export const INDEXER_URI = process.env.INDEXER_URI || '';
export const BATCHER_URI = process.env.BATCHER_URI || '';
export const STATEFUL_URI = process.env.STATEFUL_URI || '';
export const SERVER_ONLY_MODE = process.env.SERVER_ONLY_MODE === 'true';

export const NFT_CONTRACT = process.env.NFT_CONTRACT || '';
export const STOP_BLOCKHEIGHT = process.env.STOP_BLOCKHEIGHT
  ? parseInt(process.env.STOP_BLOCKHEIGHT)
  : null;

export const PRACTICE_BOT_ADDRESS = '0x0101';

export * from './types.js';
