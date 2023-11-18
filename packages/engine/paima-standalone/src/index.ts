// Load environment variables before everything else.
import { config } from 'dotenv';
import { argumentRouter } from './utils/input.js';

import * as fs from 'fs';
import { setLogger } from '@paima/utils';

setLogger(s => {
  try {
    fs.appendFileSync('./logs.log', `${s}\n`);
  } catch (e) {}
});

// Load environment variables
config({ path: `${process.cwd()}/.env.${process.env.NODE_ENV || 'development'}` });

async function main(): Promise<void> {
  await argumentRouter();
}

void main();
