import { tx } from './pg-tx.js';
import { getConnection, getPersistentConnection } from './pg-connection.js';
import { createScheduledData, deleteScheduledData } from './scheduled-constructors.js';
import { initializePaimaTables } from './database-validation.js';
import { DataMigrations } from './data-migrations.js';

export * from './delegate-wallet.js';

// https://github.com/adelsz/pgtyped/issues/565
export type { Json } from './sql/cde-generic.queries.js';

export { getAchievementProgress, setAchievementProgress } from './sql/achievements.queries.js';
export type {
  IGetAchievementProgressParams,
  IGetAchievementProgressResult,
  ISetAchievementProgressParams,
  ISetAchievementProgressResult,
} from './sql/achievements.queries.js';
// https://github.com/adelsz/pgtyped/issues/565
export {
  getLatestProcessedBlockHeight,
  getBlockSeeds,
  getBlockHeights,
  saveLastBlock,
  blockHeightDone,
  getBlockByHash,
} from './sql/block-heights.queries.js';
export type {
  IGetLatestProcessedBlockHeightParams,
  IGetLatestProcessedBlockHeightResult,
  IGetBlockSeedsParams,
  IGetBlockSeedsResult,
  IGetBlockHeightsParams,
  IGetBlockHeightsResult,
  ISaveLastBlockParams,
  ISaveLastBlockResult,
  IBlockHeightDoneParams,
  IBlockHeightDoneResult,
  IGetBlockByHashParams,
  IGetBlockByHashResult,
} from './sql/block-heights.queries.js';
export * from './sql/statistics.queries.js';
export type * from './sql/statistics.queries.js';
export * from './sql/nonces.queries.js';
export type * from './sql/nonces.queries.js';
export * from './sql/rollup_inputs.queries.js';
export type * from './sql/rollup_inputs.queries.js';
export * from './sql/cde-tracking.queries.js';
export type * from './sql/cde-tracking.queries.js';
export * from './sql/extensions.queries.js';
export type * from './sql/extensions.queries.js';
export * from './sql/cde-erc20.queries.js';
export type * from './sql/cde-erc20.queries.js';
export * from './sql/cde-erc721.queries.js';
export type * from './sql/cde-erc721.queries.js';
export * from './sql/cde-erc20-deposit.queries.js';
export type * from './sql/cde-erc20-deposit.queries.js';
export * from './sql/cde-generic.queries.js';
export type * from './sql/cde-generic.queries.js';
export * from './sql/cde-erc1155.queries.js';
export type * from './sql/cde-erc1155.queries.js';
export * from './sql/cde-erc6551-registry.queries.js';
export type * from './sql/cde-erc6551-registry.queries.js';
export * from './sql/emulated.queries.js';
export type * from './sql/emulated.queries.js';
export type * from './sql/wallet-delegation.queries.js';
export * from './sql/wallet-delegation.queries.js';
export type * from './types.js';
export * from './sql/cde-cardano-pool-delegation.queries.js';
export type * from './sql/cde-cardano-pool-delegation.queries.js';
export * from './sql/cde-cardano-projected-nft.queries.js';
export type * from './sql/cde-cardano-projected-nft.queries.js';
export * from './sql/batcher-balance.queries.js';
export type * from './sql/batcher-balance.queries.js';
export * from './sql/cardano-last-epoch.queries.js';
export type * from './sql/cardano-last-epoch.queries.js';
// https://github.com/adelsz/pgtyped/issues/565
export {
  cdeCardanoAssetUtxosByAddress,
  cdeInsertCardanoAssetUtxo,
  cdeSpendCardanoAssetUtxo,
  ICdeCardanoAssetUtxosByAddressParams,
} from './sql/cde-cardano-asset-utxos.queries.js';
export * from './sql/cde-cursor-tracking-pagination.queries.js';
export type * from './sql/cde-cursor-tracking-pagination.queries.js';
export * from './sql/cde-cardano-transfer.queries.js';
export type * from './sql/cde-cardano-transfer.queries.js';
// https://github.com/adelsz/pgtyped/issues/565
export { cdeCardanoMintBurnInsert } from './sql/cde-cardano-mint-burn.queries.js';
export type * from './sql/mina-checkpoints.queries.js';
export * from './sql/mina-checkpoints.queries.js';
export type * from './sql/dynamic-primitives.queries.js';
export * from './sql/dynamic-primitives.queries.js';
// https://github.com/adelsz/pgtyped/issues/565
export { NumberOrString } from './sql/batcher-balance.queries.js';
export type * from './sql/events.queries.js';
export * from './sql/events.queries.js';
export * from './event-indexing.js';
export * from './register-events.js';

export {
  tx,
  getConnection,
  getPersistentConnection,
  createScheduledData,
  deleteScheduledData,
  initializePaimaTables,
  DataMigrations,
};
