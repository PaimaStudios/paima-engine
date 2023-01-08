import roundExecutor from './round_executor.js';
import Prando from '@paima/prando';
import type { RoundNumbered, Seed } from './types.js';
import type { ExecutionModeEnum } from '@paima/utils/src/types.js';

type MatchExecutor<RoundStateType, TickEvent> = {
  currentTick: number;
  currentState: RoundStateType;
  tick: (this: MatchExecutor<RoundStateType, TickEvent>) => Promise<TickEvent>;
  endState: (this: MatchExecutor<RoundStateType, TickEvent>) => Promise<RoundStateType>;
};

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
    processTick: (
      matchState: MatchType,
      userStates: UserStateType,
      moves: MoveType[],
      currentTick: number,
      randomnessGenerator: Prando
    ) => Promise<TickEvent | null>
  ) => Promise<{
    currentRound: number;
    roundExecutor: null | {
      currentTick: number;
      currentState: UserStateType;
      tick: () => Promise<TickEvent | null>;
      endState: () => Promise<UserStateType>;
    };
    tick: () => Promise<TickEvent | null>;
  }>;
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
    processTick
  ) => {
    return {
      currentRound: 0,
      roundExecutor: null,
      // NicoList: Fix this type with inspiration from round_executor
      async tick(): Promise<any> {
        console.log((await this).currentRound, 'currentRound');
        if ((await this).currentRound > maxRound) return null; // null if reached end of the match
        if (!(await this).roundExecutor) {
          // Set round executor if null
          (await this).currentRound++;
          const states = roundStates.filter(async rs => rs.round == (await this).currentRound);
          if (states.length === 0) return null; // This shouldn't happen but good to check nonetheless
          const stateObj = stateMutator(states);
          const seed = seeds.find(async s => s.round === (await this).currentRound);
          if (!seed) {
            return null;
          }
          const randomnessGenerator = new Prando(seed.seed);
          const inputs = userInputs.filter(async ui => ui.round == (await this).currentRound);
          const executor = roundExecutor.initialize(
            matchEnvironment,
            stateObj,
            inputs,
            randomnessGenerator,
            executionMode,
            processTick
          );
          (this as any).roundExecutor = executor;
        }
        const event = await (this as any).roundExecutor.tick();

        // If no event, it means that the previous round executor finished, so we recurse this function to increment the round and try again
        if (!event) {
          (await this).roundExecutor = null;
          return await (await this).tick();
        } else return event;
      },
    };
  },
};

export default matchExecutorInitializer;
