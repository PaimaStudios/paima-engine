import paimaFunnel from '@paima/funnel';
import fs from 'fs';
import paimaRuntime from '@paima/runtime';
import { doLog } from '@paima/utils';
import { gameSM } from './sm.js';
import {
  CHAIN_URI,
  gameBackendVersion,
  SERVER_ONLY_MODE,
  STOP_BLOCKHEIGHT,
  STORAGE_ADDRESS,
} from './utils';
import { importTsoaFunction } from './utils/import.js';
import { copyDirSync } from './utils/file.js';
import type { TemplateTypes } from './utils/input.js';
import { templateMap } from './utils/input.js';
import { pickGameTemplate } from './utils/input.js';

const POLLING_RATE = 1;

const prepareStandaloneStructure = (templateKey: TemplateTypes): boolean => {
  const SDK_FOLDER_PATH = `${process.cwd()}/paima-sdk`;
  const TEMPLATE_FOLDER_PATH = `${process.cwd()}/${templateMap[templateKey]}`;

  if (fs.existsSync(SDK_FOLDER_PATH) && fs.existsSync(TEMPLATE_FOLDER_PATH)) return false;

  doLog('Looks like a first run, directory structure is incomplete. Re-creating it.');
  if (!fs.existsSync(SDK_FOLDER_PATH)) {
    doLog(`Missing SDK: ${SDK_FOLDER_PATH}.`);
    const packagedSDKPath = `${__dirname}/paima-sdk`;
    copyDirSync(packagedSDKPath, SDK_FOLDER_PATH);
    doLog('✅ Created.');
  }
  if (!fs.existsSync(TEMPLATE_FOLDER_PATH)) {
    doLog(`Missing game template: ${TEMPLATE_FOLDER_PATH}.`);
    const packagedTemplatePath = `${__dirname}/templates/${templateMap[templateKey]}`;
    copyDirSync(packagedTemplatePath, TEMPLATE_FOLDER_PATH);
    doLog(`✅ Created.`);
  }
  return true;
};

async function main(): Promise<void> {
  const chosenTemplate = await pickGameTemplate();
  const isFirstRun = prepareStandaloneStructure(chosenTemplate);
  if (isFirstRun) {
    doLog('We prepared the folder structure for you.');
    doLog('Run this tool again once you completed the setup of your game folder.');
    return;
  }

  doLog(STORAGE_ADDRESS);
  const chainFunnel = await paimaFunnel.initialize(CHAIN_URI, STORAGE_ADDRESS);
  const stateMachine = gameSM();
  const engine = paimaRuntime.initialize(chainFunnel, stateMachine, gameBackendVersion);
  engine.setPollingRate(POLLING_RATE);
  const registerEndpoints = importTsoaFunction();
  engine.addEndpoints(registerEndpoints);
  void engine.run(STOP_BLOCKHEIGHT, SERVER_ONLY_MODE);
}

void main();
