import type { GameStateMachine } from '@paima/sm';
import PaimaSM from '@paima/sm';
import type { AppEventsImport, PreCompilesImport } from './utils/import.js';
import { importGameStateTransitionRouter } from './utils/import.js';
import { poolConfig } from './utils/index.js';
import { ENV } from '@paima/utils';

export const gameSM = (
  precompiles: PreCompilesImport,
  gameEvents: AppEventsImport
): GameStateMachine => {
  const gameStateTransitionRouter = importGameStateTransitionRouter();

  return PaimaSM.initialize(
    poolConfig,
    4, // https://xkcd.com/221/
    // there is no way of statically generating the event type here, since it's
    // imported at runtime.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    gameStateTransitionRouter,
    ENV.START_BLOCKHEIGHT,
    precompiles,
    gameEvents.events
  );
};
