import roundExecutor from './round_executor.js';
import Prando from '@paima/prando';
import type { RoundNumbered, Seed } from './types.js';

interface MatchExecutorInitializer {
  initialize: <
    MatchEnvironment,
    MatchState,
    MoveType extends RoundNumbered,
    TickEvent,
    RoundStateCheckpoint extends RoundNumbered
  >(
    matchEnvironment: MatchEnvironment,
    maxRound: number,
    roundStateCheckpoints: RoundStateCheckpoint[],
    seeds: Seed[],
    userInputs: MoveType[],
    stateMutator: (r: RoundStateCheckpoint[]) => MatchState,
    processTick: (
      matchEnvironment: MatchEnvironment,
      matchState: MatchState,
      submittedMoves: MoveType[],
      currentTick: number,
      randomnessGenerator: Prando
    ) => TickEvent[]
  ) => {
    currentRound: number;
    roundExecutor: null | {
      currentTick: number;
      currentState: MatchState;
      tick: () => TickEvent[];
      endState: () => MatchState;
    };
    tick: () => TickEvent[] | null;
  };
}

const matchExecutorInitializer: MatchExecutorInitializer = {
  initialize: (
    matchEnvironment,
    maxRound,
    roundStates,
    seeds,
    userInputs,
    stateMutator,
    processTick
  ) => {
    return {
      currentRound: 0,
      roundExecutor: null,
      tick(): ReturnType<typeof this.tick> {
        console.log(this.currentRound, 'currentRound');
        if (this.currentRound > maxRound) return null; // null if reached end of the match
        if (!this.roundExecutor) {
          // Set round executor if null
          this.currentRound++;
          const states = roundStates.filter(rs => rs.round == this.currentRound);
          if (states.length === 0) return null; // This shouldn't happen but good to check nonetheless
          const stateObj = stateMutator(states);
          const seed = seeds.find(s => s.round === this.currentRound);
          if (!seed) {
            return null;
          }
          const randomnessGenerator = new Prando(seed.seed);
          const inputs = userInputs.filter(ui => ui.round == this.currentRound);
          const executor = roundExecutor.initialize(
            matchEnvironment,
            stateObj,
            inputs,
            randomnessGenerator,
            processTick
          );
          this.roundExecutor = executor;
        }
        const events = this.roundExecutor.tick();

        // If no tick events, it means that the previous round executor finished
        // so we recurse this function to increment the round and try again
        if (!events) {
          this.roundExecutor = null;
          return this.tick();
        } else return events;
      },
    };
  },
};

export default matchExecutorInitializer;
