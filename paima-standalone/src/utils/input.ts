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

// Prompt user for input in the CLI
export const userPrompt = (query: string): Promise<string> => {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
};

// Top level CLI argument parser/router
export const argumentRouter = async (): Promise<void> => {
  const command = process.argv[2];

  switch (command) {
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
    doLog(`   sdk                        Initializes the SDK by itself.`);
    doLog(`   template                   Provides an interactive interface for initializing a template.`);
    doLog(
      `   template [TEMPLATE_NAME]   Initializes the template if you're familiar with the direct template name (lower case).`
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
  let availableTemplates = getFolderNames(PACKAGED_TEMPLATES_PATH);
  if (availableTemplates.includes(templateArg)) return templateArg;

  // Move the "generic" template to the first position if it exists
  availableTemplates = availableTemplates.sort((a, b) => (a === 'generic' ? -1 : b === 'generic' ? 1 : 0));

  doLog(`Please select one of the following templates (by number):`);

  // Print out the template names
  availableTemplates.forEach((templateName, index) => {
    let displayName: string;

    switch (templateName) {
      case 'generic':
        displayName = 'Generic (Unity FE)';
        break;
      case 'chess':
        displayName = 'Chess (TypeScript FE)';
        break;
      case 'rock-paper-scissors':
        displayName = 'Rock Paper Scissors (TypeScript FE)';
        break;
      default:
        displayName = templateName;
    }

    doLog(`  ${index + 1}. ${displayName}`);
  });

  // User template choosing
  const chosenTemplateIndex = parseInt(await userPrompt(``));
  if (!isNaN(chosenTemplateIndex) && chosenTemplateIndex > 0 && chosenTemplateIndex <= availableTemplates.length) {
    return availableTemplates[chosenTemplateIndex - 1];
  }

  // Default case
  const defaultTemplate = availableTemplates[0];
  doLog(`Unknown selection, ${defaultTemplate} will be used.`);
  return defaultTemplate;
};
