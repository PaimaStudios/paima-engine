import { doLog } from '@paima/utils';
import { createInterface } from 'readline';

export const userPrompt = (query: string): Promise<string> => {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve =>
    rl.question(query, ans => {
      rl.close();
      resolve(ans);
    })
  );
};

export type TemplateTypes = 'generic' | 'turn';
export const templateMap: Record<TemplateTypes, string> = {
  generic: 'paima-game-template',
  turn: 'turn-game-template',
};

function isTemplateType(arg: string): arg is TemplateTypes {
  return templateMap[arg as TemplateTypes] != undefined;
}

export const pickGameTemplate = async (): Promise<TemplateTypes> => {
  const templateArg = process.argv[2];
  if (isTemplateType(templateArg)) return templateArg;

  const chosenTemplate = await userPrompt(
    `Please pick one of: \x1b[32m${Object.keys(templateMap)}\x1b[0m, to use as a template.`
  );
  if (isTemplateType(chosenTemplate)) return chosenTemplate;

  const defaultTemplate: TemplateTypes = 'generic';
  doLog(`Unknown selection, we'll use ${defaultTemplate} instead.`);
  return defaultTemplate;
};
