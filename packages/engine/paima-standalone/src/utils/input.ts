import { FunnelFactory } from '@paima/funnel';
import paimaRuntime, { registerDocs, registerValidationErrorHandler } from '@paima/runtime';
import { ENV, GlobalConfig, doLog } from '@paima/utils';
import { exec } from 'child_process';
import { createInterface } from 'readline';
import { gameSM } from '../sm.js';
import {
  PACKAGED_TEMPLATES_PATH,
  checkForPackedGameCode,
  getFolderNames,
  getPaimaEngineVersion,
  prepareBatcher,
  prepareContract,
  prepareDocumentation,
  prepareTemplate,
} from './file.js';
import { importOpenApiJson, importTsoaFunction } from './import.js';
import type { Template } from './types.js';
import RegisterRoutes, { EngineService } from '@paima/rest';

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
export const argumentRouter = async (): Promise<void> => {
  switch (process.argv[2]) {
    case 'init':
      await initCommand();
      break;

    case 'run':
      await runPaimaEngine();
      break;

    case 'contracts':
      contractCommand();
      break;

    case 'docs':
      documentationCommand();
      break;

    case 'version':
      versionCommand();
      break;

    case 'webui':
      await startWebServer();
      break;

    case 'batcher':
      batcherCommand();
      break;

    default:
      helpCommand();
  }
};

// Init command logic
export const initCommand = async (): Promise<void> => {
  const init_arg = process.argv[3];

  if (init_arg == 'template') {
    const chosenTemplate = await pickGameTemplate(process.argv[4]);
    prepareTemplate(chosenTemplate);
    if (chosenTemplate === 'web-2.5') prepareBatcher(true);
  } else {
    doLog(`Usage: paima-engine init ARG`);
    doLog(`Valid Arguments:`);
    doLog(
      `   template                   Provides an interactive interface for initializing a template.`
    );
    doLog(
      `   template [TEMPLATE_NAME]   Initializes the template if you're familiar with the direct template name.`
    );
  }
};

// Run command logic
export const runPaimaEngine = async (): Promise<void> => {
  // Verify env file is filled out before progressing
  const restrictions = [];
  // localhost networks start at block 0, so it's easier to just enable a start block of 0 for them
  if (ENV.NETWORK !== 'localhost') {
    restrictions.push({
      name: 'START_BLOCKHEIGHT',
      val: ENV.START_BLOCKHEIGHT || undefined,
    });
  }
  const missingEnvs = restrictions.filter(env => env.val === undefined);
  if (missingEnvs.length > 0) {
    doLog(
      `Please ensure that your .env.{NETWORK} file is filled out properly before starting your game node. Missing ${missingEnvs.map(env => env.name).join(',')}`
    );
    process.exit(0);
  }

  const [_, config] = await GlobalConfig.mainEvmConfig();

  // Check that packed game code is available
  if (checkForPackedGameCode()) {
    doLog(`Starting Game Node...`);
    doLog(`Using RPC: ${config.chainUri}`);
    doLog(`Targeting Smart Contact: ${config.paimaL2ContractAddress}`);
    const stateMachine = gameSM();
    const funnelFactory = await FunnelFactory.initialize(
      config.chainUri,
      config.paimaL2ContractAddress
    );
    const engine = paimaRuntime.initialize(funnelFactory, stateMachine, ENV.GAME_NODE_VERSION);

    EngineService.INSTANCE.updateSM(stateMachine);
    engine.setPollingRate(ENV.POLLING_RATE);
    engine.addEndpoints(importTsoaFunction());
    engine.addEndpoints(RegisterRoutes);
    registerDocs(importOpenApiJson());
    registerValidationErrorHandler();

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
  doLog(`   contracts Saves the bundled smart contracts to your local filesystem.`);
  doLog(`   docs      Saves the Paima Engine documentation to your local filesystem.`);
  // TODO: fix webui
  // doLog(`   webui     Starts Paima Game Input Tester WebUI.`);
  doLog(`   help      Shows list of commands currently available.`);
  doLog(`   version   Shows the version of used paima-engine.`);
  doLog(`   batcher   Saves the bundled batcher project to your local filesystem.`);
};

// Batcher command logic
export const batcherCommand = (): void => {
  prepareBatcher();
};

// Build middleware for specific .env file and launch webserver:
const startWebServer = (): Promise<void> =>
  new Promise((resolve, reject) => {
    // running `npm ci` in `/paima-sdk` is required to this command to work.
    doLog('Paima Game Node Tester WebUI At: http://127.0.0.1:9123');
    exec(
      'npm run build:standalone-web-ui && npm run start:standalone-web-ui',
      {
        cwd: './paima-sdk/paima-mw-core',
      },
      err => {
        if (err) return reject(err);
        return resolve();
      }
    );
  });

// Allows the user to choose the game template
const pickGameTemplate = async (templateArg: string): Promise<Template> => {
  let availableTemplates = getFolderNames(PACKAGED_TEMPLATES_PATH);
  if (templateArg) {
    const selection = availableTemplates.find(template => template === templateArg.toLowerCase());
    if (selection) return selection;
  }

  // Move the "generic" template to the first position if it exists
  availableTemplates.sort((a, b) => (a === 'generic' ? -1 : b === 'generic' ? 1 : 0));

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
      case 'open-world':
        displayName = 'Open World (JavaScript FE)';
        break;
      case 'nft-lvlup':
        displayName = 'NFT LevelUp (Stateful NFTs)';
        break;
      case 'web-2.5':
        displayName = 'Web 2.5 (Self-signing batcher inputs)';
        break;
      default:
        displayName = templateName;
    }

    doLog(`  ${index + 1}. ${displayName}`);
  });

  // User template choosing
  const chosenTemplateIndex = parseInt(await userPrompt(``));
  if (
    !isNaN(chosenTemplateIndex) &&
    chosenTemplateIndex > 0 &&
    chosenTemplateIndex <= availableTemplates.length
  ) {
    return availableTemplates[chosenTemplateIndex - 1];
  }

  // Default case
  const defaultTemplate = availableTemplates[0];
  doLog(`Unknown selection, ${defaultTemplate} will be used.`);
  return defaultTemplate;
};
