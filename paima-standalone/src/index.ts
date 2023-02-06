import paimaFunnel from '@paima/funnel';
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

const POLLING_RATE = 1;

async function main(): Promise<void> {
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
