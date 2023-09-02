import Flatted from 'flatted';
import * as fsa from './fs_access/fsa.js';

export function logError(error: unknown): void {
  const s = `***ERROR***\n${error}\n***`;
  doLog(s);
}

// TODO: probably we want to unify this with pushLog
export function doLog(...s: unknown[]): void {
  console.log(...s);
  for (const str of s) {
    if (typeof str !== 'object') {
      if (typeof str === 'function') {
        continue;
      }
      fsa.appendToFile(String(str));
    } else if (str instanceof Error) {
      fsa.appendToFile(`${str.name}: ${str.message}\nStack: ${str.stack}`);
    } else {
      try {
        fsa.appendToFile(Flatted.stringify(str));
      } catch (e) {
        // should not happen, but maybe there is some type that fails for some reason
      }
    }
  }
}
