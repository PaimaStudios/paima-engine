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
  ) => Promise<{
    currentTick: number;
    currentState: RoundStateType;
    tick: () => Promise<TickEvent | null>;
    endState: () => Promise<RoundStateType>;
  }>;
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
      async tick(): Promise<any> {
        // NicoList: here I send stuff to bullmq
        // eslint-disable-next-line no-console
        console.log('Nico>>> roundExecutor');
        console.log('Match Environment', matchEnvironment);
        console.log('User State', (await this).currentState);

        // NicoList: which processTick is this?
        // Maybe we need to pass game name as well
        // depending on method name, we can call the right processTick

        const job = await myQueue.add(QUEUE_NAME, {
          matchState: matchEnvironment,
          userStates: (await this).currentState,
          moves: userInputs,
          currentTick: (await this).currentTick,
          randomnessGeneratorData: randomnessGenerator.serializeToJSON(),
        });

        // const event = processTick(
        //   matchEnvironment,
        //   this.currentState,
        //   userInputs,
        //   this.currentTick,
        //   randomnessGenerator
        // );
        (await this).currentTick++;
        return job.returnvalue;
      },
      async endState(): Promise<ReturnType<any>> {
        while ((await (await this).tick()) !== null);
        return (await this).currentState;
      },
    };
  },
};

export default roundExecutor;
