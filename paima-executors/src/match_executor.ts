import roundExecutor from './round_executor.js';
import Prando from '@paima/prando';
import type { RoundNumbered, Seed } from './types.js';

export interface NewRoundEvent {
  eventType: 'newRound';
  nextRound: number;
}
interface MatchExecutorInitializer {
  initialize: <MatchType, MatchState, MoveType extends RoundNumbered, TickEvent>(
    matchEnvironment: MatchType,
    maxRound: number,
    roundState: MatchState,
    seeds: Seed[],
    userInputs: MoveType[],
    processTick: (
      matchEnvironment: MatchType,
      roundState: MatchState,
      submittedMoves: MoveType[],
      currentTick: number,
      randomnessGenerator: Prando
    ) => TickEvent[] | null
  ) => {
    currentRound: number;
    currentState: MatchState;
    roundExecutor: null | {
      currentTick: number;
      currentState: MatchState;
      tick: () => TickEvent[] | null;
      endState: () => MatchState;
    };
    __nextRound: () => void;
    tick: () => TickEvent[] | [NewRoundEvent] | null;
  };
}

const matchExecutorInitializer: MatchExecutorInitializer = {
  initialize: (matchEnvironment, totalRounds, initialState, seeds, userInputs, processTick) => {
    return {
      currentRound: 0,
      currentState: initialState,
      totalRounds: totalRounds,
      roundExecutor: null,
      __nextRound(): void {
        this.currentRound++;
        const seed = seeds.find(s => s.round === this.currentRound);
        if (!seed) {
          this.roundExecutor = null;
          return;
        }
        const randomnessGenerator = new Prando(seed.seed);
        const inputs = userInputs.filter(ui => ui.round == this.currentRound);
        const executor = roundExecutor.initialize(
          matchEnvironment,
          this.currentState,
          inputs,
          randomnessGenerator,
          processTick
        );
        this.roundExecutor = executor;
      },
      tick(): ReturnType<typeof this.tick> {
        // If the match executor was just initialized,
        // fetch the round executor of the first round
        if (this.currentRound === 0) this.__nextRound();
        // If no round executor is available, return null
        // ending the match executor itself
        if (!this.roundExecutor) return null;
        // If all good, call the round executor and return its output
        const events = this.roundExecutor.tick();
        if (events) return events;
        // If the round executor returned null, the round is ended
        // so we increment the round
        else {
          // Unless we're already at the last round. If so,
          // delete the round executor and return null
          if (this.currentRound === totalRounds) return null;
          else {
            // If there are still rounds to execute, increment round
            // and return newRound event
            this.__nextRound();
            return [{
              eventType: 'newRound',
              nextRound: this.currentRound, // incremented by __nextRound(),
            }];
          }
        }
      },
    };
  },
};

export default matchExecutorInitializer;
