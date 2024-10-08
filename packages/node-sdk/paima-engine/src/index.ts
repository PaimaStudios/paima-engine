import type { GameStateMachine, GameStateTransitionFunctionRouter } from '@paima/sm';
import PaimaSM from '@paima/sm';
import { ConfigNetworkType, doLog, ENV, GlobalConfig } from '@paima/utils';
import { config } from 'dotenv';
import type { PoolConfig } from 'pg';
import type { LogEvent, LogEventFields, RegisteredEvent } from '@paima/events/';
import { groupEvents } from '@paima/events';
import { FunnelFactory } from '@paima/funnel';
import type { TsoaFunction } from '@paima/runtime';
import paimaRuntime, {
  registerDocsAppEvents,
  registerDocsOpenAPI,
  registerDocsPrecompiles,
  registerValidationErrorHandler,
} from '@paima/runtime';
import RegisterRoutes, { EngineService } from '@paima/rest';
import type { AchievementMetadata } from '@paima/utils-backend';
import type { TSchema } from '@sinclair/typebox';
import type { STFSubmittedData } from '@paima/chain-types';

export type SubmittedChainData = STFSubmittedData;
export type PreCompiles = { [name: string]: `0x${string}` };
export type OpenApi = object;
export type GameCode = GameStateTransitionFunctionRouter<any>;
export type Endpoints = {
  default: TsoaFunction;
  achievements?: Promise<AchievementMetadata>;
};

config({ path: `${process.cwd()}/.env.${process.env.NETWORK || 'localhost'}` });

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PW || '',
  database: process.env.DB_NAME || '',
  port: parseInt(process.env.DB_PORT || '5432', 10),
};

// Run command logic
export const runPaimaEngine = async <
  T extends Record<string, RegisteredEvent<LogEvent<LogEventFields<TSchema>[]>>>,
>(
  gameStateTransitionRouter: GameCode,
  precompiles: PreCompiles,
  gameEvents: T,
  openApi: OpenApi,
  endpoints: Endpoints
): Promise<void> => {
  // Verify env file is filled out before progressing
  const restrictions = [];
  // localhost networks start at block 0, so it's easier to just enable a start block of 0 for them
  if (ENV.NETWORK !== 'localhost') {
    restrictions.push({
      name: 'START_BLOCKHEIGHT',
      val: ENV.START_BLOCKHEIGHT || undefined,
    });
  }
  const missingEnvs = restrictions.filter(env => env.val === undefined);
  if (missingEnvs.length > 0) {
    doLog(
      `Please ensure that your .env.{NETWORK} file is filled out properly before starting your game node. Missing ${missingEnvs.map(env => env.name).join(',')}`
    );
    process.exit(0);
  }

  const mainConfig = await GlobalConfig.mainConfig();

  // Check that packed game code is available
  doLog(`Starting Game Node...`);

  if (mainConfig[1].type === ConfigNetworkType.EVM) {
    doLog(`Using RPC: ${mainConfig[1].chainUri}`);
    doLog(`Targeting Smart Contact: ${mainConfig[1].paimaL2ContractAddress}`);
  }

  // Import & initialize state machine
  const stateMachine = (<
    T extends Record<string, RegisteredEvent<LogEvent<LogEventFields<TSchema>[]>>>,
  >(
    gameStateTransitionRouter: GameCode,
    precompiles: PreCompiles,
    gameEvents: T
  ): GameStateMachine => {
    return PaimaSM.initialize(
      poolConfig,
      4, // https://xkcd.com/221/
      gameStateTransitionRouter,
      ENV.START_BLOCKHEIGHT,
      { precompiles },
      groupEvents(gameEvents)
    );
  })(gameStateTransitionRouter, precompiles, gameEvents);
  console.log(`Connecting to database at ${poolConfig.host}:${poolConfig.port}`);
  const dbConn = await stateMachine.getReadonlyDbConn().connect();
  const funnelFactory = await FunnelFactory.initialize(dbConn);
  {
    try {
      const startingBlock = await funnelFactory.sharedData.mainNetworkApi.getStartingBlock();
      if (startingBlock == null) throw new Error(`Failed to fetch timestamp for starting block`);
    } catch (e) {
      console.error('Could not find fetch starting block for main funnel');
      console.error('Check your internet connection and/or START_BLOCKHEIGHT configuration');
      throw e;
    }
  }
  const engine = paimaRuntime.initialize(funnelFactory, stateMachine, ENV.GAME_NODE_VERSION);

  // Import & initialize REST server
  EngineService.INSTANCE = new EngineService({
    stateMachine,
    achievements: endpoints.achievements || null,
  });

  engine.setPollingRate(ENV.POLLING_RATE);
  engine.addEndpoints(endpoints.default);
  engine.addEndpoints(RegisterRoutes);
  registerDocsOpenAPI(openApi);
  registerDocsPrecompiles(precompiles);
  registerValidationErrorHandler();
  registerDocsAppEvents(groupEvents(gameEvents));

  void engine.run(ENV.STOP_BLOCKHEIGHT, ENV.SERVER_ONLY_MODE);
};
