import { doLog, logError, delay } from '@paima/utils';
import type { GameStateMachine } from '@paima/sm';

import { run } from './run-flag.js';
import type { PoolClient } from 'pg';

export async function loopIfStopBlockReached(
  latestReadBlockHeight: number,
  stopBlockHeight: number | null
): Promise<void> {
  if (stopBlockHeight !== null && latestReadBlockHeight >= stopBlockHeight) {
    doLog(`Reached stop block height, stopping the funnel...`);
    while (run) {
      await delay(2000);
    }
    process.exit(0);
  }
}

export function exitIfStopped(run: boolean): void {
  if (!run) {
    process.exit(0);
  }
}

export async function acquireLatestBlockHeight(
  sm: GameStateMachine,
  waitPeriod: number,
  dbTx?: PoolClient
): Promise<number> {
  let wasDown = false;
  while (run) {
    try {
      const latestReadBlockHeight = await sm.latestProcessedBlockHeight(dbTx);
      if (wasDown) {
        doLog('[paima-runtime] Block height re-acquired successfully.');
      }
      return latestReadBlockHeight;
    } catch (err) {
      if (!wasDown) {
        doLog(
          `[paima-runtime] Encountered error in reading latest block height, retrying after ${waitPeriod} ms`
        );
        logError(err);
      }
      wasDown = true;
      await delay(waitPeriod);
    }
  }
  exitIfStopped(run);
  return -1;
}

export class TimeoutError extends Error {
  constructor(
    message: string,
    public readonly timeout: number
  ) {
    super(message);
    this.name = 'TimeoutError';
  }
}
