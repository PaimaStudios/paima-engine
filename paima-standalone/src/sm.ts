import type { GameStateMachine } from '@paima/db';
import PaimaSM from '@paima/sm';
import { importGameStateTransitionRouter } from './utils/import';
import { poolConfig } from './utils';
import { ENV } from '@paima/utils';

export const gameSM = (): GameStateMachine => {
  const gameStateTransitionRouter = importGameStateTransitionRouter();
  return PaimaSM.initialize(poolConfig, 4, gameStateTransitionRouter, ENV.START_BLOCKHEIGHT);
};
