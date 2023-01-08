import type Prando from '@paima/prando';
import type { RoundNumbered } from './types.js';
import { Queue } from 'bullmq';
import type { ExecutionModeEnum } from '@paima/utils/src/types.js';

// NicoList: move somewhere else
// NicoList: read stuff from env as well
const redisConfiguration = {
  connection: {
    host: process.env.HOST || 'localhost',
    port: parseInt(process.env.PORT || '6379'),
    username: process.env.USERNAME || 'default',
    password: process.env.PASSWORD || 'redispw',
  },
};
const QUEUE_NAME = 'default-queue';
const myQueue = new Queue(QUEUE_NAME, { ...redisConfiguration });
// NicoList: ^^^^

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
    processTick: (
      matchEnvironment: MatchType,
      userState: RoundStateType,
      moves: MoveType[],
      currentTick: number,
      randomnessGenerator: Prando
    ) => TickEvent
  ) => Promise<RoundExecutor<RoundStateType, TickEvent>>;
}

const roundExecutor: RoundExecutorInitializer = {
  initialize: async (
    matchEnvironment,
    roundState,
    userInputs,
    randomnessGenerator,
    executionMode,
    processTick
  ) => {
    return {
      currentTick: 1,
      currentState: roundState,
      async tick(): Promise<any> {
        let event;
        if (executionMode === 'Parallel') {
          // NicoLits: delete these comments when ready
          // eslint-disable-next-line no-console
          console.log('Nico>>> roundExecutor');
          console.log('Match Environment', matchEnvironment);
          console.log('User State', this.currentState);

          // NicoList: which processTick is this?
          // Maybe we need to pass game name as well
          // depending on method name, we can call the right processTick
          const job = await myQueue.add(QUEUE_NAME, {
            gameName: 'JungleWars',
            matchState: matchEnvironment,
            userStates: this.currentState,
            moves: userInputs,
            currentTick: this.currentTick,
            randomnessGeneratorData: randomnessGenerator.serializeToJSON(),
          });
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
