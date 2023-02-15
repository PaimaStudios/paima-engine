import gameStateTransitionV1 from './stf/v1/transition.js';

function gameStateTransitionRouter(blockHeight: number) {
  if (blockHeight >= 0) return gameStateTransitionV1;
  else return gameStateTransitionV1;
}

export default gameStateTransitionRouter;
