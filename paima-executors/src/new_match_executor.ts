import roundExecutor from './round_executor.js';
import Prando from '@paima/prando';
import type { RoundNumbered, Seed } from './types.js';

export interface NewRoundEvent {
  eventType: 'newRound';
  nextRound: number;
}
interface MatchExecutorInitializer {
  initialize: <
    MatchType,
    RoundState,
    MoveType extends RoundNumbered,
    TickEvent
  >(
    matchEnvironment: MatchType,
    maxRound: number,
    roundState: RoundState,
    seeds: Seed[],
    userInputs: MoveType[],
    processTick: (
      matchEnvironment: MatchType,
      roundState: RoundState,
      moves: MoveType[],
      currentTick: number,
      randomnessGenerator: Prando
    ) => TickEvent
  ) => {
    currentRound: number;
    currentState: RoundState;
    roundExecutor: null | {
      currentTick: number;
      currentState: RoundState;
      tick: () => TickEvent;
      endState: () => RoundState;
    };
    __nextRound: () => void;
    tick: () => TickEvent | NewRoundEvent | null;
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
        if (this.currentRound >= totalRounds) {
          this.roundExecutor = null;
          return;
        }
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
        if (this.currentRound === 0){
          this.__nextRound()
          return this.tick()
        }
        if (!this.roundExecutor) {
          return null;
        }
        const event = this.roundExecutor.tick();
        if (event) {
          return event;
        } else {
          this.__nextRound();
          return {
            eventType: 'newRound',
            nextRound: this.currentRound + 1,
          };
        }
      },
    };
  },
};

export default matchExecutorInitializer;
