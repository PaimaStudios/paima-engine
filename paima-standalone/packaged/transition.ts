type GameStateTransitionFunction = any;

// TODO: example generated file

const transitionFuction: GameStateTransitionFunction = async () => {
  console.log('TODO: implement transitionFuction');
  return [];
};
const gameStateTransitionRouter = (blockHeight: number): GameStateTransitionFunction => {
  if (blockHeight >= 0) return transitionFuction;
  else return transitionFuction;
};

export default gameStateTransitionRouter;
