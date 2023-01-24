import type { GameStateMachine, GameStateTransitionFunction } from '@paima/utils';
import { doLog } from '@paima/utils';
import PaimaSM from '@paima/sm';
import type { PoolConfig } from 'pg';

// TODO: improve env handling (access from one central place)
const getPoolConfig = (): PoolConfig => ({
  host: process.env.DB_HOST || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PW || '',
  database: process.env.DB_NAME || '',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});
const START_BLOCKHEIGHT = 0;

// TODO: temporary transition function & router. should be loaded at runtime from user provided code
const transitionFuction: GameStateTransitionFunction = async () => {
  doLog('TODO: implement transitionFuction');
  return [];
};
const gameStateTransitionRouter = (blockHeight: number): GameStateTransitionFunction => {
  if (blockHeight >= 0) return transitionFuction;
  else return transitionFuction;
};

export const gameSM = (): GameStateMachine => {
  const creds: PoolConfig = getPoolConfig();
  return PaimaSM.initialize(creds, 4, gameStateTransitionRouter, START_BLOCKHEIGHT);
};
