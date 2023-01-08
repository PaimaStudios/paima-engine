import type Prando from '@paima/prando';
import type { RoundNumbered } from './types.js';
import type { ExecutionModeEnum, GameNameEnum } from '@paima/utils/src/types.js';
import Parallelization from './paralellization.js';

type RoundExecutor<RoundStateType, TickEvent> = {
  currentTick: number;
  currentState: RoundStateType;
  tick: (this: RoundExecutor<RoundStateType, TickEvent>) => Promise<TickEvent>;
  endState: (this: RoundExecutor<RoundStateType, TickEvent>) => Promise<RoundStateType>;
};

interface RoundExecutorInitializer {
  initialize: <MatchType, RoundStateType, MoveType extends RoundNumbered, TickEvent>(
    matchEnvironment: MatchType,
    userStates: RoundStateType,
    userInputs: MoveType[],
    randomnessGenerator: Prando,
    executionMode: ExecutionModeEnum,
    gameName: GameNameEnum,
    stateIdentifier: string,
    processTick: (
      matchEnvironment: MatchType,
      userState: RoundStateType,
      moves: MoveType[],
      currentTick: number,
      randomnessGenerator: Prando
    ) => TickEvent
  ) => Promise<RoundExecutor<RoundStateType, TickEvent>>;
}

let _parallelization: Parallelization | null;

const roundExecutor: RoundExecutorInitializer = {
  initialize: async (
    matchEnvironment,
    roundState,
    userInputs,
    randomnessGenerator,
    executionMode,
    gameName,
    stateIdentifier,
    processTick
  ) => {
    return {
      currentTick: 1,
      currentState: roundState,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async tick(): Promise<any> {
        let event;
        if (executionMode === 'Parallel') {
          if (_parallelization == null) {
            _parallelization = new Parallelization();
          }

          const params = {
            gameName: gameName,
            matchState: matchEnvironment,
            userStates: this.currentState,
            moves: userInputs,
            currentTick: this.currentTick,
            randomnessGeneratorData: randomnessGenerator.serializeToJSON(),
          };

          // NicoLits: delete this comment when ready
          // eslint-disable-next-line no-console
          console.log('Nico>>> roundExecutor: ', { stateIdentifier, ...params });
          const job = await _parallelization.addJob(stateIdentifier, params);
          event = job.returnvalue;
        } else if (executionMode === 'Sequential') {
          event = processTick(
            matchEnvironment,
            this.currentState,
            userInputs,
            this.currentTick,
            randomnessGenerator
          );
        } else {
          throw new Error('Invalid execution mode');
        }

        this.currentTick++;
        return event;
      },
      async endState(): ReturnType<typeof this.endState> {
        while ((await this.tick()) !== null);
        return this.currentState;
      },
    };
  },
};

export default roundExecutor;
