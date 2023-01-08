import roundExecutor from './round_executor.js';
import type { RoundExecutor } from './round_executor.js';
import Prando from '@paima/prando';
import type { RoundNumbered, Seed } from './types.js';
import type { ExecutionModeEnum, GameNameEnum } from '@paima/utils/src/types.js';

// NicoList: Fix this type with inspiration from round_executor
type MatchExecutor<RoundStateType, TickEvent> = {
  currentRound: number;
  roundExecutor: RoundExecutor<RoundStateType, TickEvent> | null;
  tick: (this: MatchExecutor<RoundStateType, TickEvent>) => Promise<TickEvent | null>;
};

// Type 'Promise<RoundExecutor<UserStateType, Promise<TickEvent | null>>>' is not assignable to type 'RoundState'.
//   'RoundState' could be instantiated with an arbitrary type which could be unrelated to 'Promise<RoundExecutor<UserStateType, Promise<TickEvent | null>>>'

// TODO: RoundExecutor Previous Type. Delete after confirmation on the above
// {
//   currentRound: number;
//   roundExecutor: null | {
//     currentTick: number;
//     currentState: UserStateType;
//     tick: () => Promise<TickEvent | null>;
//     endState: () => Promise<UserStateType>;
//   };
//   tick: () => Promise<TickEvent | null>;
// }

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
    roundStates: RoundState[],
    seeds: Seed[],
    userInputs: MoveType[],
    stateMutator: (r: RoundState[]) => UserStateType,
    executionMode: ExecutionModeEnum,
    gameName: GameNameEnum,
    stateIdentifier: string,
    processTick: (
      matchState: MatchType,
      userStates: UserStateType,
      moves: MoveType[],
      currentTick: number,
      randomnessGenerator: Prando
    ) => Promise<TickEvent | null>
  ) => Promise<MatchExecutor<UserStateType, TickEvent>>;
}

const matchExecutorInitializer: MatchExecutorInitializer = {
  initialize: async (
    matchEnvironment,
    maxRound,
    roundStates,
    seeds,
    userInputs,
    stateMutator,
    executionMode,
    gameName,
    stateIdentifier,
    processTick
  ) => {
    return {
      currentRound: 0,
      roundExecutor: null,
      // NicoList: Fix this type with inspiration from round_executor
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async tick(): Promise<any> {
        // eslint-disable-next-line no-console
        console.log(this.currentRound, 'currentRound');
        if (this.currentRound > maxRound) return null; // null if reached end of the match
        if (!this.roundExecutor) {
          // Set round executor if null
          this.currentRound++;
          const states = roundStates.filter(async rs => rs.round == this.currentRound);
          if (states.length === 0) return null; // This shouldn't happen but good to check nonetheless
          const stateObj = stateMutator(states);
          const seed = seeds.find(async s => s.round === this.currentRound);
          if (!seed) {
            return null;
          }
          const randomnessGenerator = new Prando(seed.seed);
          const inputs = userInputs.filter(async ui => ui.round == this.currentRound);
          const executor = await roundExecutor.initialize(
            matchEnvironment,
            stateObj,
            inputs,
            randomnessGenerator,
            executionMode,
            gameName,
            stateIdentifier,
            processTick
          );
          this.roundExecutor = executor;
        }
        const event = await this.roundExecutor.tick();

        // If no event, it means that the previous round executor finished, so we recurse this function to increment the round and try again
        if (!event) {
          this.roundExecutor = null;
          return await this.tick();
        } else return event;
      },
    };
  },
};

export default matchExecutorInitializer;
