import type { GameStateTransitionFunction } from '@paima/utils';
import { doLog } from '@paima/utils';
import PaimaSM from '@paima/sm';

const creds = {
  host: process.env.DB_HOST,  user: process.env.DB_USER,
  password: process.env.DB_PW,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '5432', 10),
};
const START_BLOCKHEIGHT = 0;

// TODO: temporary SM function. should be loaded at runtime
const transitionFuction: GameStateTransitionFunction = async () => {
  doLog('TODO: implement transitionFuction');
  return [];
};

const gameStateTransitionRouter = (blockHeight: number): GameStateTransitionFunction => {
  if (blockHeight >= 0) return transitionFuction;
  else return transitionFuction;
};

const gameSM = PaimaSM.initialize(creds, 4, gameStateTransitionRouter, START_BLOCKHEIGHT);

export default gameSM;
