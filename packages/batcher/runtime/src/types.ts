import type { RequestHandler } from 'express';
import type { BatchedTransactionPoster } from '@paima/batcher-transaction-poster';
import type GameInputValidator from '@paima/batcher-game-input-validator';
import type { Pool } from 'pg';
import type { EthersEvmProvider, PolkadotProvider } from '@paima/providers';

export interface BatcherRuntimeInitializer {
  initialize: (pool: Pool) => BatcherRuntime;
}

export interface BatcherRuntime {
  addGET: (route: string, callback: RequestHandler) => void;
  addPOST: (route: string, callback: RequestHandler) => void;
  run: (
    gameInputValidator: GameInputValidator,
    BatchedTransactionPoster: BatchedTransactionPoster,
    provider: EthersEvmProvider | PolkadotProvider,
    getCurrentBlock: () => Promise<number>
  ) => Promise<void>;
}
