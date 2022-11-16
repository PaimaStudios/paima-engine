import * as fsa from './fs_access/fsa.js';
import type { ChainData } from './types';

export async function logBlock(block: ChainData): Promise<void> {
  const s = `Block #${block.blockNumber} received from Paima Funnel. Contains ${block.submittedData.length} pieces of input.`;
  await doLog(s);
  if (block.submittedData.length) console.log(block);
}
export async function logSuccess(block: ChainData): Promise<void> {
  const s = `Block #${block.blockNumber} finished processing by Paima SM.`;
  await doLog(s);
}
export async function logError(error: unknown): Promise<void> {
  const s = `***ERROR***\n${error}\n***`;
  await doLog(s);
}

export async function doLog(s: string): Promise<void> {
  console.log(s);
  try {
    await fsa.appendToFile(s);
  } catch {}
}
