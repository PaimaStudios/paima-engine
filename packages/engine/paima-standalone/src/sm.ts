import type { GameStateMachine } from '@paima/sm';
import PaimaSM from '@paima/sm';
import { importGameStateTransitionRouter } from './utils/import.js';
import { poolConfig } from './utils/index.js';
import { ENV } from '@paima/utils';

export const gameSM = (): GameStateMachine => {
  const gameStateTransitionRouter = importGameStateTransitionRouter();
  return PaimaSM.initialize(poolConfig, 4, gameStateTransitionRouter, ENV.START_BLOCKHEIGHT);
};
