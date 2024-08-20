import AvailBatchedTransactionPoster from './avail.js';
import EvmBatchedTransactionPoster from './evm.js';
import BatchedTransactionPoster from './transactionPoster.js';

export { AvailBatchedTransactionPoster, EvmBatchedTransactionPoster, BatchedTransactionPoster };

export class BatchedTransactionPosterStore {
  static reference: BatchedTransactionPoster | null = null;
}
