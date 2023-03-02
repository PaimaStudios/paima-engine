import type Prando from '@paima/prando';
import type { RoundNumbered } from './types.js';

interface RoundExecutorInitializer {
  initialize: <MatchEnvironment, MatchState, MoveType extends RoundNumbered, TickEvent>(
    matchEnvironment: MatchEnvironment,
    matchState: MatchState,
    submittedMoves: MoveType[],
    randomnessGenerator: Prando,
    processTick: (
      matchEnvironment: MatchEnvironment,
      matchState: MatchState,
      submittedMoves: MoveType[],
      currentTick: number,
      randomnessGenerator: Prando
    ) => TickEvent[]
  ) => {
    currentTick: number;
    currentState: MatchState;
    tick: () => TickEvent[];
    endState: () => MatchState;
  };
}

const roundExecutor: RoundExecutorInitializer = {
  initialize: (matchEnvironment, matchState, userInputs, randomnessGenerator, processTick) => {
    return {
      currentTick: 1,
      currentState: matchState,
      tick(): ReturnType<typeof this.tick> {
        const events = processTick(
          matchEnvironment,
          this.currentState,
          userInputs,
          this.currentTick,
          randomnessGenerator
        );
        this.currentTick++;
        return events;
      },
      endState(): ReturnType<typeof this.endState> {
        while (this.tick() !== null);
        return this.currentState;
      },
    };
  },
};

export default roundExecutor;
