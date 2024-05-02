/**
 * Canonical definition of what Paima Engine directly imports from the
 * `packaged/` directory. The game code itself may load what it will, or
 * configuration may also refer to file paths within `packaged/`.
 */
import type { GameStateTransitionFunctionRouter } from '@paima/sm';
import type { TsoaFunction } from '@paima/runtime';

function importFile<T>(path: string): T {
  // dynamic import cannot be used here due to PKG limitations
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(`${process.cwd}/${path}`);
}

export interface GameCodeImport {
  default: GameStateTransitionFunctionRouter;
}
export const ROUTER_FILENAME = 'packaged/gameCode.cjs';
/**
 * Reads repackaged user's code placed next to the executable in `gameCode.cjs` file
 */
export function importGameStateTransitionRouter(): GameStateTransitionFunctionRouter {
  return importFile<GameCodeImport>(ROUTER_FILENAME).default;
}

export interface EndpointsImport {
  default: TsoaFunction;
}
export const API_FILENAME = 'packaged/endpoints.cjs';
/**
 * Reads repackaged user's code placed next to the executable in `endpoints.cjs` file
 */
export function importTsoaFunction(): TsoaFunction {
  return importFile<EndpointsImport>(API_FILENAME).default;
}

export type OpenApiImport = object;
export const GAME_OPENAPI_FILENAME = 'packaged/openapi.json';
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
