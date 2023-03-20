// Load environment variables before everything else.
import { config } from 'dotenv';
export const path = `${process.cwd()}/.env.${process.env.NODE_ENV || 'development'}`
config({ path });

// eslint-disable-next-line import/imports-first
import { argumentRouter } from './utils/input.js';

async function main(): Promise<void> {
  await argumentRouter();
}

void main();
