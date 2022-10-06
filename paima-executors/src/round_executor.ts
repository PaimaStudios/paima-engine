import type Prando from "@paima/prando";
import type { RoundNumbered } from "./types.js";

interface RoundExecutorInitializer {
    initialize: <
        MatchType,
        RoundStateType,
        MoveType extends RoundNumbered,
        TickEvent
    >(
        matchEnvironment: MatchType,
        userStates: RoundStateType,
        userInputs: MoveType[],
        randomnessGenerator: Prando,
        processTick: (
            matchEnvironment: MatchType,
            userState: RoundStateType,
            moves: MoveType[],
            currentTick: number,
            randomnessGenerator: Prando
        ) => TickEvent
    ) => {
        currentTick: number;
        currentState: RoundStateType;
        tick: () => TickEvent;
        endState: () => RoundStateType;
    };
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
