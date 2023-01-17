import roundExecutor from './round_executor.js';
import Prando from '@paima/prando';
import type { RoundNumbered, Seed } from './types.js';

interface MatchExecutorInitializer {
  initialize: <
    MatchType,
    UserStateType,
    MoveType extends RoundNumbered,
    TickEvent,
    RoundState extends RoundNumbered
  >(
    matchEnvironment: MatchType,
    maxRound: number,
    roundState: RoundState[],
    seeds: Seed[],
    userInputs: MoveType[],
    stateMutator: (r: RoundState[]) => UserStateType,
    processTick: (
      mt: MatchType,
      s: UserStateType,
      m: MoveType[],
      c: number,
      randomnessGenerator: Prando
    ) => TickEvent
  ) => {
    currentRound: number;
    roundExecutor: null | {
      currentTick: number;
      currentState: UserStateType;
      tick: () => TickEvent;
      endState: () => UserStateType;
    };
    tick: () => TickEvent | null;
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
        const event = this.roundExecutor.tick();

        // If no event, it means that the previous round executor finished, so we recurse this function to increment the round and try again
        if (!event) {
          this.roundExecutor = null;
          return this.tick();
        } else return event;
      },
    };
  },
};

export default matchExecutorInitializer;
