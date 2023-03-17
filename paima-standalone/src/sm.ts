import type { GameStateMachine } from '@paima/db';
import PaimaSM from '@paima/sm';
import { importGameStateTransitionRouter } from './utils/import';
import { poolConfig } from './utils';
import { START_BLOCKHEIGHT } from '@paima/utils';

export const gameSM = (): GameStateMachine => {
  const gameStateTransitionRouter = importGameStateTransitionRouter();
  return PaimaSM.initialize(poolConfig, 4, gameStateTransitionRouter, START_BLOCKHEIGHT);
};
