import paimaFunnel from '@paima/funnel';
import fs from 'fs';
import paimaRuntime from '@paima/runtime';
import type { ChainFunnel } from '@paima/utils';
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

const prepareSDK = (): boolean => {
  const SDK_FOLDER_PATH = `${process.cwd()}/paima-sdk`;

  if (fs.existsSync(SDK_FOLDER_PATH)) return false;

  doLog('Looks like a first run, directory structure is incomplete. Re-creating it.');
  if (!fs.existsSync(SDK_FOLDER_PATH)) {
    doLog(`Missing SDK: ${SDK_FOLDER_PATH}.`);
    const packagedSDKPath = `${__dirname}/paima-sdk`;
    copyDirSync(packagedSDKPath, SDK_FOLDER_PATH);
    doLog('✅ Created.');
  }
  return true;
};

const prepareTemplate = (templateKey: TemplateTypes): void => {
  const TEMPLATE_FOLDER_PATH = `${process.cwd()}/${templateMap[templateKey]}`;
  if (fs.existsSync(TEMPLATE_FOLDER_PATH)) {
    doLog(`Game template ${TEMPLATE_FOLDER_PATH} already exists.`);
    return;
  }

  const packagedTemplatePath = `${__dirname}/templates/${templateMap[templateKey]}`;
  copyDirSync(packagedTemplatePath, TEMPLATE_FOLDER_PATH);
  doLog(`✅ Game template created. ${TEMPLATE_FOLDER_PATH}`);
};

const POLLING_RATE = 1;

async function main(): Promise<void> {
  const isFirstRun = prepareSDK();
  if (isFirstRun) {
    const chosenTemplate = await pickGameTemplate();
    prepareTemplate(chosenTemplate);
    doLog('We prepared the folder structure for you.');
    doLog('Run this tool again, once you completed the setup of your game folder.');
    return;
  }

  doLog(STORAGE_ADDRESS);
  const chainFunnel: ChainFunnel = await paimaFunnel.initialize(CHAIN_URI, STORAGE_ADDRESS);
  const stateMachine = gameSM();
  const engine = paimaRuntime.initialize(chainFunnel, stateMachine, gameBackendVersion);
  engine.setPollingRate(POLLING_RATE);
  const registerEndpoints = importTsoaFunction();
  engine.addEndpoints(registerEndpoints);
  void engine.run(STOP_BLOCKHEIGHT, SERVER_ONLY_MODE);
}

void main();
