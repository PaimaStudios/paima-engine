import type Prando from '@paima/prando';
import type { RoundNumbered } from './types.js';
import { Queue } from 'bullmq';

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
    processTick
  ) => {
    return {
      currentTick: 1,
      currentState: roundState,
      async tick(): ReturnType<typeof this.tick> {
        // NicoList: here I send stuff to bullmq
        // eslint-disable-next-line no-console
        console.log('Nico>>> hey hey!');

        // NicoList: which processTick is this?
        // Maybe we need to pass game name as well
        // depending on method name, we can call the right processTick

        const job = await myQueue.add(QUEUE_NAME, {
          matchEnvironment,
          userState: this.currentState,
          moves: userInputs,
          currentTick: this.currentTick,
          randomnessGeneratorData: randomnessGenerator.serializeToJSON(),
        });

        // const event = processTick(
        //   matchEnvironment,
        //   this.currentState,
        //   userInputs,
        //   this.currentTick,
        //   randomnessGenerator
        // );
        this.currentTick++;
        return job.returnvalue;
      },
      async endState(): ReturnType<typeof this.endState> {
        while ((await this.tick()) !== null);
        return this.currentState;
      },
    };
  },
};

export default roundExecutor;
