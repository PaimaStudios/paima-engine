import type { GameStateTransitionFunctionRouter } from '@paima/db';
import type { TsoaFunction } from '@paima/utils';

function importFile<T>(file: string): T {
  // dynamic import cannot be used here due to PKG limitations
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { default: defaultExport } = require(`${process.cwd()}/${file}`);

  return defaultExport;
}

export const ROUTER_FILENAME = 'packaged/gameCode.cjs';
/**
 * Reads repackaged user's code placed next to the executable in `gameCode.cjs` file
 */
export const importGameStateTransitionRouter = (): GameStateTransitionFunctionRouter =>
  importFile<GameStateTransitionFunctionRouter>(ROUTER_FILENAME);

export const API_FILENAME = 'packaged/endpoints.cjs';
/**
 * Reads repackaged user's code placed next to the executable in `endpoints.cjs` file
 */
export const importTsoaFunction = (): TsoaFunction => importFile<TsoaFunction>(API_FILENAME);
