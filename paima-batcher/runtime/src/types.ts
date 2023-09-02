import type { RequestHandler } from 'express';
import type BatchedTransactionPoster from '@paima-batcher/batched-transaction-poster';
import type GameInputValidator from '@paima-batcher/game-input-validator';
import type { Web3 } from '@paima-batcher/utils';
import type { Pool } from 'pg';

export interface BatcherRuntimeInitializer {
  initialize: (pool: Pool) => BatcherRuntime;
}

export interface BatcherRuntime {
  addGET: (route: string, callback: RequestHandler) => void;
  addPOST: (route: string, callback: RequestHandler) => void;
  run: (
    gameInputValidator: GameInputValidator,
    BatchedTransactionPoster: BatchedTransactionPoster,
    walletWeb3: Web3,
    accountAddress: string
  ) => Promise<void>;
}
