import type Prando from "prando";
interface RoundExecutorInitializer {
  initialize: <MatchType, RoundStateType, MoveType, TickEvent>(
    matchEnvironment: MatchType,
    userStates: RoundStateType,
    userInputs: MoveType[],
    randomnessGenerator: Prando,
    processTick: (matchEnvironment: MatchType, userState: RoundStateType, moves: MoveType[], currentTick: number, randomnessGenerator: Prando) => TickEvent
  ) => {
    currentTick: number;
    currentState: RoundStateType;
    tick: () => TickEvent;
    endState: () => RoundStateType
  }
}

const roundExecutor: RoundExecutorInitializer = {
  initialize: (
    matchEnvironment,
    userStates,
    userInputs,
    randomnessGenerator,
    processTick
  ) => {
    return {
      currentTick: 1,
      currentState: userStates,
      tick() {
        const event = processTick(matchEnvironment, this.currentState, userInputs, this.currentTick, randomnessGenerator);
        this.currentTick++
        return event
      },
      endState() {
        for (let move of userInputs) this.tick()
        return this.currentState
      },
    };
  },
};


export default roundExecutor