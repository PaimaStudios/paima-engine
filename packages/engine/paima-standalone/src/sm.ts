import type { GameStateMachine } from '@paima/sm';
import PaimaSM from '@paima/sm';
import type { PreCompilesImport } from './utils/import.js';
import { importGameStateTransitionRouter } from './utils/import.js';
import { poolConfig } from './utils/index.js';
import { ENV } from '@paima/utils';
import type { AppEvents } from '@paima/events';

export const gameSM = (precompiles: PreCompilesImport, gameEvents: AppEvents): GameStateMachine => {
  const gameStateTransitionRouter = importGameStateTransitionRouter();

  return PaimaSM.initialize(
    poolConfig,
    4, // https://xkcd.com/221/
    gameStateTransitionRouter,
    ENV.START_BLOCKHEIGHT,
    precompiles,
    gameEvents
  );
};
