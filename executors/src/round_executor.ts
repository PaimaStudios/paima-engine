import type Prando from "prando";
interface RoundExecutorInitializer {
  initialize: <MatchType, RoundStateType, MoveType, TickEvent>(
    matchEnvironment: MatchType,
    roundState: RoundStateType,
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
    roundState,
    userInputs,
    randomnessGenerator,
    processTick
  ) => {
    return {
      currentTick: 1,
      currentState: roundState,
      tick() {
        const event = processTick(matchEnvironment, this.currentState, userInputs, this.currentTick, randomnessGenerator);
        this.currentTick++
        return event
      },
      endState() {
        while (this.tick() !== null);
        return this.currentState
      },
    };
  },
};

export default roundExecutor