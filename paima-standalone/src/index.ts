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

const POLLING_RATE = 1;

const prepareStandaloneStructure = (): void => {
  const SDK_FOLDER_PATH = `${process.cwd()}/paima-sdk`;
  const TEMPLATE_FOLDER_PATH = `${process.cwd()}/paima-game-template`;

  if (fs.existsSync(SDK_FOLDER_PATH) && fs.existsSync(TEMPLATE_FOLDER_PATH)) return;

  console.log('Looks like a first run, directory structure is incomplete. Re-creating it.');
  if (!fs.existsSync(SDK_FOLDER_PATH)) {
    console.log(`Missing SDK: ${SDK_FOLDER_PATH}.`);
    const packagedSDKPath = `${__dirname}/paima-sdk`;
    copyDirSync(packagedSDKPath, SDK_FOLDER_PATH);
  }
  if (!fs.existsSync(TEMPLATE_FOLDER_PATH)) {
    console.log(`Missing game template: ${TEMPLATE_FOLDER_PATH}.`);
    // TODO: include template code based on args
  }
};

async function main(): Promise<void> {
  prepareStandaloneStructure();

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
