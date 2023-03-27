import { createInterface } from 'readline';
import {
  prepareSDK,
  prepareTemplate,
  checkForPackedGameCode,
  prepareContract,
  prepareDocumentation,
  getFolderNames,
  PACKAGED_TEMPLATES_PATH,
  getPaimaEngineVersion,
} from './file.js';
import paimaFunnel from '@paima/funnel';
import paimaRuntime from '@paima/runtime';
import type { ChainFunnel } from '@paima/utils';
import { gameSM } from '../sm.js';
import { importTsoaFunction } from './import.js';
import { doLog, ENV } from '@paima/utils';
import { exec } from 'child_process';

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
  switch (process.argv[2]) {
    case 'init':
      await initCommand();
      break;

    case 'run':
      await runPaimaEngine();
      break;

    case 'contract':
      contractCommand();
      break;

    case 'docs':
      documentationCommand();
      break;

    case 'version':
      versionCommand();
      break;

    case 'webui':
      // npm ci is required first in paima-sdk
      exec('npm run build:standalone && npm run start:standalone', {
        cwd: './paima-sdk/paima-mw-core',
      });
      break;

    default:
      helpCommand();
  }
};

// Init command logic
export const initCommand = async (): Promise<void> => {
  const init_arg = process.argv[3];

  if (init_arg == 'sdk') {
    prepareSDK();
  } else if (init_arg == 'template') {
    const chosenTemplate = await pickGameTemplate(process.argv[4]);
    prepareTemplate(chosenTemplate);
    prepareSDK(true);
  } else {
    doLog(`Usage: paima-engine init ARG`);
    doLog(`Valid Arguments:`);
    doLog(`   sdk       Initializes the SDK by itself.`);
    doLog(`   template  Initializes a new project via a template.`);
    doLog(
      `   template [TEMPLATE_NAME] Initializes a new project via a chosen template if you're familiar with available options.`
    );
  }
};

// Run command logic
export const runPaimaEngine = async (): Promise<void> => {
  // Verify env file is filled out before progressing
  if (!ENV.CONTRACT_ADDRESS || !ENV.CHAIN_URI || !ENV.CHAIN_ID || !ENV.START_BLOCKHEIGHT) {
    doLog(
      'Please ensure that your .env.{NODE_ENV} file is filled out properly before starting your game node.'
    );
    process.exit(0);
  }

  // Check that packed game code is available
  if (checkForPackedGameCode()) {
    doLog(`Starting Game Node...`);
    doLog(`Using RPC: ${ENV.CHAIN_URI}`);
    doLog(`Targeting Smart Contact: ${ENV.CONTRACT_ADDRESS}`);
    const chainFunnel: ChainFunnel = await paimaFunnel.initialize(
      ENV.CHAIN_URI,
      ENV.CONTRACT_ADDRESS
    );
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
export const contractCommand = (): void => {
  prepareContract();
};

// Docs command logic
export const documentationCommand = (): void => {
  prepareDocumentation();
};

export const versionCommand = (): void => {
  doLog(`paima-engine v${getPaimaEngineVersion()}`);
};

// Help command printing
export const helpCommand = (): void => {
  doLog(`v${getPaimaEngineVersion()} Usage: paima-engine [COMMAND] ARG`);
  doLog(`Commands:`);
  doLog(`   init      Enables initializing project templates and the SDK.`);
  doLog(`   run       Start your game node.`);
  doLog(`   contract  Saves the Paima L2 Contract to your local filesystem.`);
  doLog(`   docs      Saves the Paima Engine documentation to your local filesystem.`);
  doLog(`   help      Shows list of commands currently available.`);
  doLog(`   version   Shows the version of used paima-engine.`);
};

// Allows the user to choose the game template
const pickGameTemplate = async (templateArg: string): Promise<string> => {
  const availableTemplates = getFolderNames(PACKAGED_TEMPLATES_PATH);
  if (availableTemplates.includes(templateArg)) return templateArg;

  doLog(`Please select one of the following templates:`);

  availableTemplates.forEach(templateName => {
    doLog(`  - ${templateName}`);
  });

  const chosenTemplate = await userPrompt(``);
  if (availableTemplates.includes(chosenTemplate)) return chosenTemplate;

  const defaultTemplate = availableTemplates[0];
  doLog(`Unknown selection, ${defaultTemplate} will be used.`);
  return defaultTemplate;
};
