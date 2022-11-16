import * as fsa from './fs_access/fsa.js';
import type { ChainData } from './types';

export function logBlock(block: ChainData): void {
  const s = `Block #${block.blockNumber} received from Paima Funnel. Contains ${block.submittedData.length} pieces of input.`;
  doLog(s);
  if (block.submittedData.length) console.log(block);
}
export function logSuccess(block: ChainData): void {
  const s = `Block #${block.blockNumber} finished processing by Paima SM.`;
  doLog(s);
}
export function logError(error: unknown): void {
  const s = `***ERROR***\n${error}\n***`;
  doLog(s);
}

export function doLog(s: string): void {
  console.log(s);
  fsa.appendToFile(s);
}
