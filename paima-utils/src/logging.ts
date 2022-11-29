import * as fsa from './fs_access/fsa.js';

export function logError(error: unknown): void {
  const s = `***ERROR***\n${error}\n***`;
  doLog(s);
}

export function doLog(s: string): void {
  console.log(s);
  fsa.appendToFile(s);
}
