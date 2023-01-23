import paimaFunnel from '@paima/funnel';
import paimaRuntime from '@paima/runtime';
import { doLog } from '@paima/utils';
import stateMachine from './sm.js';
// import { setPool } from '@catapult/db';

const POLLING_RATE = 1;
// TODO: env files support in compiled executable
const STORAGE_ADDRESS = process.env.STORAGE_ADDRESS || '';
const CHAIN_URI = process.env.CHAIN_URI || '';
const STOP_BLOCKHEIGHT = parseInt(process.env.STOP_BLOCKHEIGHT || '0');
const SERVER_ONLY_MODE = process.env.SERVER_ONLY_MODE == 'true';
const gameBackendVersion = '1.1.1';

async function main(): Promise<void> {
  doLog(STORAGE_ADDRESS);
  const chainFunnel = await paimaFunnel.initialize(CHAIN_URI, STORAGE_ADDRESS);
  // TODO: custom user setPool code
  // setPool(stateMachine.getReadonlyDbConn());
  const engine = paimaRuntime.initialize(chainFunnel, stateMachine, gameBackendVersion);
  engine.setPollingRate(POLLING_RATE);
  // TODO: custom user tsoa
  // engine.addEndpoints(registerEndpoints);
  void engine.run(STOP_BLOCKHEIGHT, SERVER_ONLY_MODE);
}

void main();
