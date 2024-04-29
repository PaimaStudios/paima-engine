import type { GameStateTransitionFunctionRouter } from '@paima/sm';
import type { TsoaFunction } from '@paima/runtime';
import type { AchievementService } from '@paima/utils-backend';

export const ROUTER_FILENAME = 'packaged/gameCode.cjs';
interface GameCodeCjs {
  default: GameStateTransitionFunctionRouter;
}
/**
 * Reads repackaged user's code placed next to the executable in `gameCode.cjs` file
 */
export function importGameStateTransitionRouter(): GameStateTransitionFunctionRouter {
  return (require(`${process.cwd()}/${ROUTER_FILENAME}`) as GameCodeCjs).default;
}

export const API_FILENAME = 'packaged/endpoints.cjs';
export interface EndpointsCjs {
  default: TsoaFunction;
  AchievementService?: new () => AchievementService;
}
/**
 * Reads repackaged user's code placed next to the executable in `endpoints.cjs` file
 */
export function importEndpoints(): EndpointsCjs {
  return require(`${process.cwd()}/${API_FILENAME}`);
}

export const GAME_OPENAPI_FILENAME = 'packaged/openapi.json';
export type OpenApiJson = object;
/**
 * Reads repackaged user's code placed next to the executable in `endpoints.cjs` file
 */
export function importOpenApiJson(): OpenApiJson | undefined {
  try {
    return require(`${process.cwd()}/${GAME_OPENAPI_FILENAME}`);
  } catch (e) {
    return undefined;
  }
}
