import type { GameStateMachine } from '@paima/utils';
import PaimaSM from '@paima/sm';
import { importGameStateTransitionRouter } from './utils/import';
import { poolConfig, START_BLOCKHEIGHT } from './utils';

export const gameSM = (): GameStateMachine => {
  const gameStateTransitionRouter = importGameStateTransitionRouter();
  return PaimaSM.initialize(poolConfig, 4, gameStateTransitionRouter, START_BLOCKHEIGHT);
};
