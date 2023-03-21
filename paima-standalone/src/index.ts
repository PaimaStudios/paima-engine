// Load environment variables before everything else.
import { config } from 'dotenv';
import { ENV } from '@paima/utils';
import { argumentRouter } from './utils/input.js';

// Load environment variables
config({ path: `${process.cwd()}/.env.${process.env.NODE_ENV || 'development'}` });

// Check if .env loaded correctly
ENV.doHealthCheck();

async function main(): Promise<void> {
  await argumentRouter();
}

void main();
