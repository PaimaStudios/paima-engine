import { config } from 'dotenv';

import paimaFunnel from '@paima/funnel';
import paimaRuntime from '@paima/runtime';
import { doLog } from '@paima/utils';
import { gameSM } from './sm.js';
// import { setPool } from '@catapult/db';

config({ path: `${process.cwd()}/.env.${process.env.NODE_ENV || 'development'}`, debug: true });

const POLLING_RATE = 1;
// TODO: improve env files support in compiled executable
const STORAGE_ADDRESS = process.env.STORAGE_ADDRESS || '';
const CHAIN_URI = process.env.CHAIN_URI || '';
const STOP_BLOCKHEIGHT = process.env.STOP_BLOCKHEIGHT
  ? parseInt(process.env.STOP_BLOCKHEIGHT)
  : null;
const SERVER_ONLY_MODE = process.env.SERVER_ONLY_MODE == 'true';
const gameBackendVersion = '1.1.1';

async function main(): Promise<void> {
  doLog(STORAGE_ADDRESS);
  const chainFunnel = await paimaFunnel.initialize(CHAIN_URI, STORAGE_ADDRESS);
  const stateMachine = gameSM();
  // TODO: custom user setPool code
  // setPool(stateMachine.getReadonlyDbConn());
  const engine = paimaRuntime.initialize(chainFunnel, stateMachine, gameBackendVersion);
  engine.setPollingRate(POLLING_RATE);
  // TODO: custom user tsoa
  // engine.addEndpoints(registerEndpoints);
  void engine.run(STOP_BLOCKHEIGHT, SERVER_ONLY_MODE);
}

void main();
