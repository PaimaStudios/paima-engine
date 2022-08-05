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
      // first three are called by the frontendg
      currentTick: 1,
      currentState: userStates, // keep track of how many moves have been processed
      // ticks don't know if someone died before all moves are processed
      tick() {
        console.log(this.currentTick, "processing tick number")
        const event = processTick(matchEnvironment, this.currentState, userInputs, this.currentTick, randomnessGenerator);
        console.log(event, `output of tick for tick ${this.currentTick}`)
        this.currentTick++
        return event
      },
      // this is run by the backend
      endState() {
        for (let move of userInputs) this.tick()
        return this.currentState
      },
    };
  },
};


export default roundExecutor