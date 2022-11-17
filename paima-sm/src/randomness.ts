import Prando from '@paima/prando';
import type { ChainData } from '@paima/utils';
import Crypto from 'crypto';
import type pg from 'pg';
import { consumer } from '@paima/concise';
import { getBlockSeeds } from './sql/queries.queries.js';

export function randomnessRouter(n: number): typeof getSeed1 {
  if (n) return getSeed1;
  else throw Error('wrong randomness protocol set');
}

function parseInput(encodedInput: string): string[] {
  const conciseConsumer = consumer.tryInitialize(encodedInput);
  return conciseConsumer.conciseValues.map(cValue => cValue.value);
}

function chooseData(chainData: ChainData, seed: string): string[] {
  const prando = new Prando(seed);
  const randomSelection = (): boolean => {
    const randomValue = Math.round(prando.next());
    return randomValue === 1;
  };

  let chosenData = [];
  for (let dataChunk of chainData.submittedData) {
    if (randomSelection()) chosenData.push(dataChunk.inputNonce);
    if (randomSelection()) chosenData.push(dataChunk.userAddress);
    for (let data of parseInput(dataChunk.inputData)) {
      if (randomSelection()) chosenData.push(data);
    }
  }

  return chosenData;
}

/*
 * Basic randomness generation protocol which hashes together previous seeds and randomly selected chain data
 */
async function getSeed1(latestChainData: ChainData, DBConn: pg.Pool): Promise<string> {
  const blockSeeds = (await getBlockSeeds.run(undefined, DBConn)).map(result => result.seed);
  const interimSeed = hashTogether([latestChainData.blockHash, ...blockSeeds]);
  const selectedChainData = chooseData(latestChainData, interimSeed);
  const seed = hashTogether([...selectedChainData, latestChainData.blockHash, ...blockSeeds]);
  return seed;
}

function hashTogether(data: string[]): string {
  return Crypto.createHash('sha256').update(data.join()).digest('base64');
}
