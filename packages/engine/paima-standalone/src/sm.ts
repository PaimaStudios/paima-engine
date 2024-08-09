import type { GameStateMachine } from '@paima/sm';
import PaimaSM from '@paima/sm';
import { importGameStateTransitionRouter, importEvents } from './utils/import.js';
import type { PreCompilesImport } from './utils/import.js';
import { poolConfig } from './utils/index.js';
import { ENV } from '@paima/utils';

export const gameSM = (precompiles: PreCompilesImport): GameStateMachine => {
  const gameStateTransitionRouter = importGameStateTransitionRouter();
  const events = importEvents();

  return PaimaSM.initialize(
    poolConfig,
    4, // https://xkcd.com/221/
    gameStateTransitionRouter,
    ENV.START_BLOCKHEIGHT,
    precompiles,
    events.GameEvents
  );
};
