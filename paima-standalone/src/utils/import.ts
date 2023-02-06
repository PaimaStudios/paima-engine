import type { GameStateTransitionFunctionRouter, TsoaFunction } from '@paima/utils';

function importFile<T>(file: string): T {
  // dynamic import cannot be used here due to PKG limitations
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { default: defaultExport } = require(`${process.cwd()}/${file}`);

  return defaultExport;
}

const ROUTER_FILENAME = 'backend.cjs';
/**
 * Reads repackaged user's code placed next to the executable in `backend.cjs` file
 * @returns GameStateTransitionFunctionRouter
 */
export const importGameStateTransitionRouter = (): GameStateTransitionFunctionRouter =>
  importFile<GameStateTransitionFunctionRouter>(ROUTER_FILENAME);

const API_FILENAME = 'registerEndpoints.cjs';
/**
 * Reads repackaged user's code placed next to the executable in `registerEndpoints.cjs` file
 * @returns GameStateTransitionFunctionRouter
 */
export const importTsoaFunction = (): TsoaFunction => importFile<TsoaFunction>(API_FILENAME);
