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
import { doLog, ENV } from '@paima/utils';

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
  // Verify env file is filled out before progressing
  if (
    !process.env.STORAGE_ADDRESS ||
    !process.env.CHAIN_URI ||
    !process.env.CHAIN_ID ||
    !process.env.START_BLOCKHEIGHT
  ) {
    doLog(
      'Please ensure that your .env file is filled out properly before starting your game node.'
    );
    process.exit(0);
  }

  // Check that packed game code is available
  if (checkForPackedGameCode()) {
    doLog(`Starting Game Node...`);
    doLog(`Using RPC: ${ENV.CHAIN_URI}`);
    doLog(`Targeting Smart Contact: ${ENV.STORAGE_ADDRESS}`);
    const chainFunnel: ChainFunnel = await paimaFunnel.initialize(ENV.CHAIN_URI, ENV.STORAGE_ADDRESS);
    const stateMachine = gameSM();
    const engine = paimaRuntime.initialize(chainFunnel, stateMachine, ENV.GAME_NODE_VERSION);
    const registerEndpoints = importTsoaFunction();

    engine.setPollingRate(ENV.POLLING_RATE);
    engine.addEndpoints(registerEndpoints);

    void engine.run(ENV.STOP_BLOCKHEIGHT, ENV.SERVER_ONLY_MODE);
  } else {
    doLog(`Packed game code not found.`);
    doLog(
      `Please ensure that you have packed your game code and it is accessible by the executable.`
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
