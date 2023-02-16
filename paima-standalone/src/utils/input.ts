import { doLog } from '@paima/utils';
import { createInterface } from 'readline';
import {
  prepareSDK,
  prepareTemplate,
  checkForPackedGameCode,
  prepareContract,
  prepareDocumentation,
} from './file.js';
import paimaFunnel from '@paima/funnel';
import paimaRuntime from '@paima/runtime';
import type { ChainFunnel } from '@paima/utils';
import { gameSM } from '../sm.js';
import { importTsoaFunction } from './import.js';
import {
  CHAIN_URI,
  gameBackendVersion,
  SERVER_ONLY_MODE,
  STOP_BLOCKHEIGHT,
  STORAGE_ADDRESS,
} from './index.js';

// Templates type & map
export type TemplateTypes = 'generic' | 'turn';
export const templateMap: Record<TemplateTypes, string> = {
  generic: 'generic-game-template',
  turn: 'turn-game-template',
};

// Prompt user for input in the CLI
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

// Top level CLI argument parser/router
// Potentially switch to https://github.com/75lb/command-line-args or otherwise
export const argumentRouter = async (): Promise<void> => {
  const base_arg = process.argv[2];

  if (base_arg == 'init') {
    await initCommand();
  } else if (base_arg == 'run') {
    await runPaimaEngine();
  } else if (base_arg == 'contract') {
    await contractCommand();
  } else if (base_arg == 'docs') {
    await documentationCommand();
  } else {
    await helpCommand();
  }
};

// Init command logic
export const initCommand = async (): Promise<void> => {
  const init_arg = process.argv[3];

  if (init_arg == 'sdk') {
    prepareSDK();
  } else if (init_arg == 'template') {
    const chosenTemplate = await pickGameTemplate();
    prepareTemplate(chosenTemplate);
    prepareSDK();
  } else {
    doLog(`Usage: paima-engine init ARG`);
    doLog(`Valid Arguments:`);
    doLog(`   sdk       Initializes the SDK by itself.`);
    doLog(`   template  Initializes a new project via a template.`);
  }
};

// Run command logic
export const runPaimaEngine = async (): Promise<void> => {
  const POLLING_RATE = 1;

  if (checkForPackedGameCode()) {
    doLog(`Starting Game Node...`);
    doLog(`Targeting Smart Contact: ${STORAGE_ADDRESS}`);
    const chainFunnel: ChainFunnel = await paimaFunnel.initialize(CHAIN_URI, STORAGE_ADDRESS);
    const stateMachine = gameSM();
    const engine = paimaRuntime.initialize(chainFunnel, stateMachine, gameBackendVersion);
    const registerEndpoints = importTsoaFunction();

    engine.setPollingRate(POLLING_RATE);
    engine.addEndpoints(registerEndpoints);

    void engine.run(STOP_BLOCKHEIGHT, SERVER_ONLY_MODE);
  } else {
    doLog(`Packed game code not found.`);
    doLog(
      `Please ensure that you have built/packed your game code and it is available in the same directory as this executable.`
    );
  }
};

// Contract command logic
export const contractCommand = async (): Promise<void> => {
  prepareContract();
};

// Docs command logic
export const documentationCommand = async (): Promise<void> => {
  prepareDocumentation();
};

// Help command printing
export const helpCommand = async (): Promise<void> => {
  doLog(`Usage: paima-engine [COMMAND] ARG`);
  doLog(`Commands:`);
  doLog(`   init      Enables initializing project templates and the SDK.`);
  doLog(`   run       Start your game node.`);
  doLog(`   contract  Saves the Paima L2 Contract to your local filesystem.`);
  doLog(`   docs      Saves the Paima Engine documentation to your local filesystem.`);
  doLog(`   help      Shows list of commands currently available.`);
};

// Check the template type
function isTemplateType(arg: string): arg is TemplateTypes {
  return templateMap[arg as TemplateTypes] != undefined;
}

// Allows the user to choose the game template
const pickGameTemplate = async (): Promise<TemplateTypes> => {
  const templateArg = process.argv[2];
  if (isTemplateType(templateArg)) return templateArg;

  doLog(`Please select one of the following templates:`);

  Object.keys(templateMap).forEach(templateName => {
    doLog(`  - ${templateName}`);
  });

  const chosenTemplate = await userPrompt(``);
  if (isTemplateType(chosenTemplate)) return chosenTemplate;

  const defaultTemplate: TemplateTypes = 'generic';
  doLog(`Unknown selection, ${defaultTemplate} will be used.`);
  return defaultTemplate;
};
