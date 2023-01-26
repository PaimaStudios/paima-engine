import type Prando from '@paima/prando';
import type { SubmittedChainData } from '@paima/utils';
import type { Pool } from 'pg';
// TODO: type imports...sdk
type GameStateTransitionFunction = any;

// TODO: example generated file

const transitionFuction: GameStateTransitionFunction = async (
  inputData: SubmittedChainData,
  blockHeight: number,
  _randomnessGenerator: Prando,
  _dbConn: Pool
) => {
  console.log(inputData, `parsing input data @ ${blockHeight}`);
  console.log(`Received input string: ${inputData.inputData}`);

  return [];
};
const gameStateTransitionRouter = (blockHeight: number): GameStateTransitionFunction => {
  if (blockHeight >= 0) return transitionFuction;
  else return transitionFuction;
};

export default gameStateTransitionRouter;
