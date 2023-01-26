import type { GameStateMachine } from '@paima/utils';
import PaimaSM from '@paima/sm';
import type { PoolConfig } from 'pg';
import { importRouter } from './transpile';

// TODO: improve env handling (access from one central place)
const getPoolConfig = (): PoolConfig => ({
  host: process.env.DB_HOST || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PW || '',
  database: process.env.DB_NAME || '',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});
const START_BLOCKHEIGHT = 0;

export const gameSM = (): GameStateMachine => {
  const creds: PoolConfig = getPoolConfig();
  const gameStateTransitionRouter = importRouter();
  return PaimaSM.initialize(creds, 4, gameStateTransitionRouter, START_BLOCKHEIGHT);
};
