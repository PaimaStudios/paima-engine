/**
 * Canonical definition of what Paima Engine directly imports from the
 * `packaged/` directory. The game code itself may load what it will, or
 * configuration may also refer to file paths within `packaged/`.
 */
import fs from 'fs';
import type { GameStateTransitionFunctionRouter } from '@paima/sm';
import type { TsoaFunction } from '@paima/runtime';
import type { AchievementMetadata } from '@paima/utils-backend';

/**
 * Checks that the user packed their game code and it is available for Paima Engine to use to run
 */
export function checkForPackedGameCode(): boolean {
  const GAME_CODE_PATH = `${process.cwd()}/${ROUTER_FILENAME}`;
  const ENDPOINTS_PATH = `${process.cwd()}/${API_FILENAME}`;
  return fs.existsSync(ENDPOINTS_PATH) && fs.existsSync(GAME_CODE_PATH);
}

function importFile<T>(path: string): T {
  // dynamic import cannot be used here due to PKG limitations
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(`${process.cwd()}/${path}`);
}

export interface GameCodeImport {
  default: GameStateTransitionFunctionRouter;
}
const ROUTER_FILENAME = 'packaged/gameCode.cjs';
/**
 * Reads repackaged user's code placed next to the executable in `gameCode.cjs` file
 */
export function importGameStateTransitionRouter(): GameStateTransitionFunctionRouter {
  return importFile<GameCodeImport>(ROUTER_FILENAME).default;
}

export interface EndpointsImport {
  default: TsoaFunction;
  achievements?: Promise<AchievementMetadata>;
}
const API_FILENAME = 'packaged/endpoints.cjs';
/**
 * Reads repackaged user's code placed next to the executable in `endpoints.cjs` file
 */
export function importEndpoints(): EndpointsImport {
  return importFile<EndpointsImport>(API_FILENAME);
}

export type OpenApiImport = object;
const GAME_OPENAPI_FILENAME = 'packaged/openapi.json';
/**
 * Reads OpenAPI definitions placed next to the executable in `openapi.json` file
 */
export function importOpenApiJson(): OpenApiImport | undefined {
  try {
    return importFile(GAME_OPENAPI_FILENAME);
  } catch (e) {
    return undefined;
  }
}

export type PreCompilesImport = { precompiles: { [name: string]: `0x${string}` } };
const PRECOMPILES_FILENAME = 'packaged/precompiles.cjs';
/**
 * Reads repackaged user's code placed next to the executable in `precompiles.cjs` file
 */
export function importPrecompiles(): PreCompilesImport {
  return importFile<PreCompilesImport>(PRECOMPILES_FILENAME);
}
