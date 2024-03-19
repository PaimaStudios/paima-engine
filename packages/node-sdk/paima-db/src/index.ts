import { tx } from './pg-tx.js';
import { getConnection, getPersistentConnection } from './pg-connection.js';
import { createScheduledData, deleteScheduledData } from './scheduled-constructors.js';
import { initializePaimaTables } from './database-validation.js';
import { DataMigrations } from './data-migrations.js';

export * from './delegate-wallet.js';

export * from './sql/block-heights.queries.js';
export type * from './sql/block-heights.queries.js';
export * from './sql/scheduled.queries.js';
export type * from './sql/scheduled.queries.js';
export * from './sql/nonces.queries.js';
export type * from './sql/nonces.queries.js';
export * from './sql/historical.queries.js';
export type * from './sql/historical.queries.js';
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
export * from './sql/cardano-last-epoch.queries.js';
export type * from './sql/cardano-last-epoch.queries.js';
// https://github.com/adelsz/pgtyped/issues/565
export {
  cdeCardanoAssetUtxosByAddress,
  cdeInsertCardanoAssetUtxo,
  cdeSpendCardanoAssetUtxo,
  ICdeCardanoAssetUtxosByAddressParams,
} from './sql/cde-cardano-asset-utxos.queries.js';
export * from './sql/cde-cardano-tracking-pagination.queries.js';
export type * from './sql/cde-cardano-tracking-pagination.queries.js';
export * from './sql/cde-cardano-transfer.queries.js';
export type * from './sql/cde-cardano-transfer.queries.js';
export { cdeCardanoMintBurnInsert } from './sql/cde-cardano-mint-burn.queries.js';

export {
  tx,
  getConnection,
  getPersistentConnection,
  createScheduledData,
  deleteScheduledData,
  initializePaimaTables,
  DataMigrations,
};
