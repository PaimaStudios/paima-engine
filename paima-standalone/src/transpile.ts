import ts from 'typescript';
import fs from 'fs';
import type { GameStateTransitionFunctionRouter } from '@paima/utils';

const transitionRouterPath = `${process.cwd()}/transition`;

export const importRouter = (): GameStateTransitionFunctionRouter => {
  const tsFile = fs.readFileSync(`${transitionRouterPath}.ts`);
  const jsCode = ts.transpileModule(tsFile.toString(), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  fs.writeFileSync(`${transitionRouterPath}.cjs`, jsCode.outputText);
  // import cannot be used here due to PKG limitations
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { default: gameStateTransitionRouter } = require(`${transitionRouterPath}.cjs`);

  return gameStateTransitionRouter;
};
