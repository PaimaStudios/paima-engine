// Load environment variables before everything else.
import { config } from 'dotenv';
import { argumentRouter } from './utils/input.js';

// Load environment variables
config({ path: `${process.cwd()}/.env.${process.env.NODE_ENV || 'development'}` });

async function main(): Promise<void> {
  await argumentRouter();
}

void main();
