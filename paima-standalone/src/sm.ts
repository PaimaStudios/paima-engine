import type { GameStateMachine } from '@paima/utils';
import PaimaSM from '@paima/sm';
import { importRouter } from './transpile';
import { poolConfig, START_BLOCKHEIGHT } from './utils';

export const gameSM = (): GameStateMachine => {
  const gameStateTransitionRouter = importRouter();
  return PaimaSM.initialize(poolConfig, 4, gameStateTransitionRouter, START_BLOCKHEIGHT);
};
