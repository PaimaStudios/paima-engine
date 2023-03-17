import roundExecutor from './round_executor.js';
import Prando from '@paima/prando';
import type { RoundNumbered, Seed, MatchExecutor, ProcessTickFn } from './types.js';

interface MatchExecutorInitializer {
  initialize: <MatchEnvironment, MatchState, MoveType extends RoundNumbered, TickEvent>(
    matchEnvironment: MatchEnvironment,
    totalRounds: number,
    initialState: MatchState,
    seeds: Seed[],
    submittedMoves: MoveType[],
    processTick: ProcessTickFn<MatchEnvironment, MatchState, MoveType, TickEvent>
  ) => MatchExecutor<MatchState, TickEvent>;
}

const matchExecutorInitializer: MatchExecutorInitializer = {
  initialize: (matchEnvironment, totalRounds, initialState, seeds, submittedMoves, processTick) => {
    return {
      currentRound: 0,
      currentState: initialState,
      totalRounds: totalRounds,
      roundExecutor: null,
      __nextRound(): void {
        this.currentRound++;
        const seed = seeds.find(seed => seed.round === this.currentRound);
        if (!seed) {
          this.roundExecutor = null;
          return;
        }
        const randomnessGenerator = new Prando(seed.seed);
        const inputs = submittedMoves.filter(move => move.round == this.currentRound);
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
            return [
              {
                eventType: 'newRound',
                roundNumber: this.currentRound, // incremented by __nextRound(),
              },
            ];
          }
        }
      },
    };
  },
};

export default matchExecutorInitializer;
