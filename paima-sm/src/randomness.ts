import type { ChainData } from '@paima/utils';
import Crypto from 'crypto';
import type pg from 'pg';

import { getRandomness } from './sql/queries.queries.js';

export function randomnessRouter(n: number): typeof getSeed1 {
  if (n) return getSeed1;
  else throw Error('wrong randomness protocol set');
}

// Basic randomness generation protocol which hashes together previous seeds + latest block hash
async function getSeed1(latestChainData: ChainData, DBConn: pg.Pool): Promise<string> {
  const hashes = await getRandomness.run(undefined, DBConn);
  const seed = hashTogether([latestChainData.blockHash, ...hashes.map(h => h.seed)]);
  return seed;
}

function hashTogether(hashes: string[]): string {
  return Crypto.createHash('sha256').update(hashes.join()).digest('base64');
}
